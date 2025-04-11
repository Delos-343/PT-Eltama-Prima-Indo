import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="w-full bg-blue-600 py-4 shadow-md">
      <div className="max-w-screen-xl mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="text-sm font-extralight text-gray-300">
          PT ELTAMA PRIMA INDO
        </Link>

        {user ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">
              Logged in as <span className="font-semibold">{user.username}</span>{' '}
              <span className="bg-blue-800 text-xs px-2 py-1 rounded-full">
                {user.role}
              </span>
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="bg-white hover:bg-blue-800 text-blue-600 hover:text-white text-sm py-1 px-4 rounded"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
