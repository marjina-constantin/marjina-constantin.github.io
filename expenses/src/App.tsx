import './App.scss';
import { AuthProvider, NotificationProvider, SyncStatusProvider, useAuthState, useData, useAuthDispatch } from './context';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AppRoute from './components/AppRoute';
import React, { useEffect, useRef } from 'react';
import routes from './config/routes';
import Navbar from './components/Navbar';
import SyncStatusIndicator from './components/SyncStatusIndicator';
import { setupNetworkListener } from './utils/syncService';
import { AuthState } from './type/types';
import { initializeAuthErrorHandler } from './utils/authErrorHandler';

// Component to setup sync when user is logged in
const SyncSetup: React.FC = () => {
  const { token } = useAuthState() as AuthState;
  const { data, dataDispatch } = useData();
  const dispatch = useAuthDispatch();
  const filtersRef = useRef({
    category: data?.category || '',
    textFilter: data?.textFilter || '',
  });

  // Initialize authentication error handler once
  useEffect(() => {
    initializeAuthErrorHandler(dispatch, dataDispatch);
  }, [dispatch, dataDispatch]);

  useEffect(() => {
    filtersRef.current = {
      category: (data && data.category) || '',
      textFilter: (data && data.textFilter) || '',
    };
  }, [data?.category, data?.textFilter]);

  useEffect(() => {
    if (token) {
      // Setup network listener for auto-sync when coming online
      const cleanup = setupNetworkListener(token, dataDispatch, () => filtersRef.current);
      return cleanup;
    }
  }, [token, dataDispatch]);

  return null;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SyncStatusProvider>
          <Router>
            <SyncSetup />
            <SyncStatusIndicator />
            <Navbar />

            <Routes>
              {routes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={
                    <AppRoute
                      component={route.component}
                      isPrivate={route.isPrivate}
                    />
                  }
                />
              ))}
            </Routes>
          </Router>
        </SyncStatusProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
