import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Catalog, Login, Navbar, ProtectedRoute } from './components';
import AuthProvider from './context/AuthContext';

function App() {
  
  const location = useLocation();
  const hideNavbar = location.pathname === '/login';

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100">
        {!hideNavbar && <Navbar />}
        <div className="w-full max-w-screen-xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/catalog"
              element={
                <ProtectedRoute>
                  <Catalog />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/catalog" replace />} />
          </Routes>
        </div>
        <ToastContainer position="bottom-right" />
      </div>
    </AuthProvider>
  );
}

export default App;
