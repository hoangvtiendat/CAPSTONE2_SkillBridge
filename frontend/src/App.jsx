
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import HomePage from './pages/home/HomePage';
import LoginPage from './pages/auth/LoginPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      {/* Thêm routes khác ở đây */}
    </Routes>
  );
}

export default App;
