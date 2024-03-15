import './App.scss';
import { AuthProvider, NotificationProvider } from './context';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AppRoute from './components/AppRoute';
import React from 'react';
import routes from './config/routes';
import Navbar from './components/Navbar';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
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
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
