import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from '../context';

const AppRoute = ({ component: Component, isPrivate }) => {
  const userDetails = useAuthState();

  if (isPrivate && !userDetails.token) {
    return <Navigate to="/expenses/login" />;
  }

  return <Component />;
};

export default AppRoute;
