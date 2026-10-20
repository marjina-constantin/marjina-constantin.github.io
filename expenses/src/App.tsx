import './App.scss';
import { applyChartTheme } from './utils/chartTheme';

applyChartTheme();
import { AuthProvider, NotificationProvider, SyncStatusProvider, useAuthState, useData, useAuthDispatch } from './context';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AppRoute from './components/layout/AppRoute';
import React, { useEffect, useRef } from 'react';
import routes from './config/routes';
import Navbar from './components/layout/Navbar';
import SyncStatusIndicator from './components/sync/SyncStatusIndicator';
import { setupNetworkListener } from './utils/syncService';
import { AuthState } from './types/types';
import { initializeAuthErrorHandler } from './utils/authErrorHandler';
import { refreshStatus, useEncryptionState } from './crypto/encryptionState';
import KeyNeededScreen from './components/privacy/KeyNeededScreen';
import MigrationProgress from './components/privacy/MigrationProgress';

// A locked account without the key on this device shows the key screen instead of the pages.
const EncryptionGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, userIsLoggedIn } = useAuthState() as AuthState;
  const { status, hasKey } = useEncryptionState();

  useEffect(() => {
    if (token) {
      refreshStatus(true);
    }
  }, [token]);

  if (userIsLoggedIn && status && status !== 'off' && !hasKey) {
    return <KeyNeededScreen />;
  }
  return <>{children}</>;
};

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
            <MigrationProgress />
            <Navbar />

            <EncryptionGate>
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
            </EncryptionGate>
          </Router>
        </SyncStatusProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
