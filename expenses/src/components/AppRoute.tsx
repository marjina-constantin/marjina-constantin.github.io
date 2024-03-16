import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from '../context';

interface AppRouteProps {
  component: React.ComponentType<any>;
  isPrivate: boolean;
}

const AppRoute: React.FC<AppRouteProps> = ({
  component: Component,
  isPrivate,
}) => {
  const userDetails = useAuthState();

  if (isPrivate && !userDetails.token) {
    return <Navigate to="/expenses/login" />;
  }

  return <Component />;
};

export default AppRoute;
