import './App.scss';
import { applyChartTheme } from './utils/chartTheme';

applyChartTheme();
import {
  AuthProvider,
  NotificationProvider,
  SyncStatusProvider,
  useAuthState,
  useData,
  useAuthDispatch,
  useSyncStatus,
} from './context';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AppRoute from './components/layout/AppRoute';
import AppPullToRefresh from './components/layout/AppPullToRefresh';
import React, { useEffect, useRef } from 'react';
import routes from './config/routes';
import Navbar from './components/layout/Navbar';
import SyncStatusIndicator from './components/sync/SyncStatusIndicator';
import { setupNetworkListener } from './utils/syncService';
import { AuthState } from './types/types';
import { initializeAuthErrorHandler } from './utils/authErrorHandler';
import { refreshStatus, useEncryptionState } from './crypto/encryptionState';
import { refreshTagCatalog } from './tags/store';
import KeyNeededScreen from './components/privacy/KeyNeededScreen';
import MigrationProgress from './components/privacy/MigrationProgress';
import BiometricLockGate from './components/privacy/BiometricLockGate';
import ErrorBoundary from './components/ui/ErrorBoundary';

// A locked account without the key on this device shows the key screen instead of the pages.
const EncryptionGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, userIsLoggedIn } = useAuthState() as AuthState;
  const { status, hasKey } = useEncryptionState();

  useEffect(() => {
    if (token) {
      refreshStatus(true);
      refreshTagCatalog();
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
  const { refreshQueueState } = useSyncStatus();
  const filtersRef = useRef({
    category: data?.category || '',
    textFilter: data?.textFilter || '',
  });

  // Initialize authentication error handler once
  useEffect(() => {
    initializeAuthErrorHandler(dispatch, dataDispatch);
  }, [dispatch, dataDispatch]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest?.(
        'button:not(:disabled), .navbar a, .currency-row, [role="button"]'
      ) as HTMLElement | null;
      if (!target || target.classList.contains('modal-close')) return;
      target.classList.remove('is-pressing');
      // Force reflow so rapid taps always replay the sink-and-spring animation
      void target.offsetWidth;
      target.classList.add('is-pressing');
    };

    const onAnimationEnd = (event: AnimationEvent) => {
      if (event.animationName === 'buttonSinkSpring') {
        (event.target as HTMLElement | null)?.classList.remove('is-pressing');
      }
    };

    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('animationend', onAnimationEnd);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('animationend', onAnimationEnd);
    };
  }, []);

  useEffect(() => {
    filtersRef.current = {
      category: (data && data.category) || '',
      textFilter: (data && data.textFilter) || '',
    };
  }, [data?.category, data?.textFilter]);

  // The queue is per account, so the pending counts change with the logged-in user.
  useEffect(() => {
    refreshQueueState();
  }, [token, refreshQueueState]);

  useEffect(() => {
    if (token) {
      // Setup network listener for auto-sync when coming online
      const cleanup = setupNetworkListener(token, dataDispatch, () => filtersRef.current);
      return cleanup;
    }
  }, [token, dataDispatch]);

  return null;
};

const AppShell: React.FC = () => {
  const { token, userDetails } = useAuthState() as AuthState;
  const userId = String(userDetails?.current_user?.uid ?? '');

  const shell = (
    <>
      <SyncSetup />
      <SyncStatusIndicator />
      <MigrationProgress />
      <Navbar />

      <AppPullToRefresh>
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
      </AppPullToRefresh>
    </>
  );

  if (!token || !userId) {
    return shell;
  }

  return <BiometricLockGate userId={userId}>{shell}</BiometricLockGate>;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <SyncStatusProvider>
            <Router>
              <AppShell />
            </Router>
          </SyncStatusProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
