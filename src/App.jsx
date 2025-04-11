import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Catalog, Login, Navbar, ProtectedRoute } from './components'
import AuthProvider from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
     <>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <div className="max-w-screen-xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/login" element={ <Login /> } />
              <Route path="/catalog" element={
                <ProtectedRoute>
                  <Catalog />
                </ProtectedRoute>
              } />
              <Route path="/" element={<Navigate to="/catalog" replace />} />
            </Routes>
          </div>
        </div>
        <ToastContainer position="bottom-right" />
      </>
    </AuthProvider>
  );
}

export default App;
