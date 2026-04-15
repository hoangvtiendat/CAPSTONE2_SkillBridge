import React from 'react';
import { Navigate } from 'react-router-dom';
import safeJsonParse from '../../utils/safeJsonParse';

const AdminRoute = ({ children }) => {
  const userInfo = safeJsonParse(localStorage.getItem('user'), null);
  const role = userInfo?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN';

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;