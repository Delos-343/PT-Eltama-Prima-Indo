import { useState } from 'react'
import { Router, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { Navbar } from './components'

function App() {

  return (
    <>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            Hello, World
          </div>
        </div>
        <ToastContainer position="bottom-right" />
      </Router>
    </>
  )
}

export default App
