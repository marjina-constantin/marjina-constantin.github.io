import React from "react";
import { Redirect, Route } from "react-router-dom";

import { useAuthState } from '../context'

const AppRoute = ({ component: Component, path, isPrivate, ...rest }) => {

  const userDetails = useAuthState()
  return (
    <Route
      path={path}
      render={props =>
        isPrivate && !Boolean(userDetails.token) ? (
          <Redirect
            to={{ pathname: "/test/build" }}
          />
        ) : (
          <Component {...props} />
        )
      }
      {...rest}
    />
  )
}

export default AppRoute