// src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('authToken');

  if (!token) {
    // If no token is found, redirect the user to the login page
    return <Navigate to="/login" />;
  }

  // If a token is found, render the page they were trying to access
  return <>{children}</>;
};

export default ProtectedRoute;