import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RecruiterRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!user || user.role?.toUpperCase() !== 'RECRUITER') {
        return <Navigate to="/login" replace />;
    }

    if (user.companyStatus === 'DEACTIVATED' && user.companyRole !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RecruiterRoute;
