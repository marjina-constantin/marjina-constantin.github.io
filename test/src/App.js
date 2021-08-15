import React from 'react';
import './App.css';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
import routes from "./config/routes";
import Navbar from "./components/Navbar";

function App() {
  return (
      <Router>
          <Navbar />

          <Switch>
              {routes.map((route) => (
                  <Route
                      key={route.path}
                      exact path={route.path}
                      component={route.component}
                  />
              ))}
          </Switch>

      </Router>
  );
}

export default App;
