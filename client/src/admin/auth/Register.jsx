import React from 'react';
import { Navigate } from 'react-router-dom';

const Register = () => {
  // Rediriger vers la page de login qui gère les deux modes
  return <Navigate to="/login" replace />;
};

export default Register;
