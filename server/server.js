
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL Connection
const pool = new Pool(
    {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'inventory_system',
        password: process.env.DB_PASSWORD || 'delos',
        port: process.env.DB_PORT || 5432,
    }
);

// Initialize DB
const initDB = async () => {

    try {
      // Create a "users" table (if nonexistent)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff'))
        )
      `);
  
      // Create an "inventory" table (if nonexistent)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS inventory (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          quantity INTEGER NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
  
      // Check if "admin" status exists for the user
      const adminResult = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
      if (adminResult.rows.length === 0) {
        // Create admin creds
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await pool.query(
          'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
          ['admin', hashedPassword, 'admin']
        );
        console.log('\n' + 'Admin status set. \n');
      }
  
      // Check if "staff" status exists for any user
      const staffResult = await pool.query('SELECT * FROM users WHERE username = $1', ['staff']);
      if (staffResult.rows.length === 0) {
        // Create default staff user
        const hashedPassword = await bcrypt.hash('staff123', 10);
        await pool.query(
          'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
          ['staff', hashedPassword, 'staff']
        );
        console.log('\n' + 'Staff assigned. \n');
      }
  
      console.log('\n' + 'Database initialized. \n');
      
    } catch (error) {
      console.error('Error initializing database:', error);
    }
};

// Auth middleware
const authenticateToken = (req, res, next) => {

  const authHeader = req.headers['authorization'];

  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {

    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = user;

    next();

  });
};

// Role-based access + control
const checkRole = (roles) => {

  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    
    next();

  };
};

// Auth Routes
app.post('/login', async (req, res) => {

  try {
    const { username, password } = req.body;
    
    // Check if user exists
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/register', authenticateToken, checkRole(['admin']), async (req, res) => {

  try {
    const { username, password, role } = req.body;
    
    if (!username || !password || !role) {
      return res.status(400).json({ message: 'Username, password, and role are required' });
    }
    
    if (role !== 'admin' && role !== 'staff') {
      return res.status(400).json({ message: 'Role must be either admin or staff' });
    }
    
    // Check if username already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Username already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const result = await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hashedPassword, role]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Catalog Routes
app.get('/catalog', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/catalog', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { name, description, quantity, price } = req.body;
    
    if (!name || quantity === undefined || price === undefined) {
      return res.status(400).json({ message: 'Name, quantity, and price are required' });
    }
    
    const result = await pool.query(
      'INSERT INTO inventory (name, description, quantity, price) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description || '', quantity, price]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding inventory item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/catalog/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, quantity, price } = req.body;
    
    if (!name || quantity === undefined || price === undefined) {
      return res.status(400).json({ message: 'Name, quantity, and price are required' });
    }
    
    const result = await pool.query(
      'UPDATE inventory SET name=$1, description=$2, quantity=$3, price=$4 WHERE id=$5 RETURNING *',
      [name, description || '', quantity, price, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/catalog/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM inventory WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.json({ message: 'Inventory item deleted', item: result.rows[0] });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
app.listen(PORT, async () => {
  await initDB();
  console.log(`Server running on port ${PORT}`);
});
