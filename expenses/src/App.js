import React from 'react';
import './App.css';
import {BrowserRouter as Router, Switch} from 'react-router-dom';
import routes from "./config/routes";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context";
import AppRoute from './components/AppRoute';

function App() {
  return (
    <AuthProvider>
      <Router basename="/expenses">
        <Navbar />

        <Switch>
          {routes.map((route) => (
            <AppRoute
              key={route.path}
              exact path={route.path}
              component={route.component}
              isPrivate={route.isPrivate}
            />
          ))}
        </Switch>

      </Router>
    </AuthProvider>
  );
}

export default App;
