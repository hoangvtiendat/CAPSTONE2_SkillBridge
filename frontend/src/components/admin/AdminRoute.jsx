import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {

  const userInfo = JSON.parse(localStorage.getItem('user')); 
  
  
  const isAdmin = userInfo && userInfo.role === 'admin';

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;