
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
        password: process.env.DB_PASSWORD || 'postgres',
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
