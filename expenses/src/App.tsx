import './App.scss';
import { AuthProvider, NotificationProvider, SyncStatusProvider, useAuthState, useData, useSyncStatus } from './context';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AppRoute from './components/AppRoute';
import React, { useEffect } from 'react';
import routes from './config/routes';
import Navbar from './components/Navbar';
import SyncStatusIndicator from './components/SyncStatusIndicator';
import { setupNetworkListener } from './utils/syncService';
import { AuthState } from './type/types';

// Component to setup sync when user is logged in
const SyncSetup: React.FC = () => {
  const { token } = useAuthState() as AuthState;
  const { dataDispatch } = useData();
  const { startSyncing, finishSyncing, markItemSynced } = useSyncStatus();

  useEffect(() => {
    if (token) {
      // Setup network listener for auto-sync when coming online
      const cleanup = setupNetworkListener(
        token,
        dataDispatch,
        startSyncing,
        finishSyncing,
        markItemSynced
      );
      return cleanup;
    }
  }, [token, dataDispatch, startSyncing, finishSyncing, markItemSynced]);

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
