import React, { useEffect, useMemo, useState } from 'react';
import { loginUser, useAuthDispatch, useAuthState } from '../../context';
import { useNavigate } from 'react-router-dom';
import { AuthState } from '../../type/types';

const Login = () => {
  const dispatch = useAuthDispatch();
  const navigate = useNavigate();
  const { loading, errorMessage, userIsLoggedIn } = useAuthState() as AuthState;
  const [isRedirecting, setIsRedirecting] = useState(false);

  const redirectUri = useMemo(() => {
    return `${window.location.origin}/expenses/login`;
  }, []);

  if (userIsLoggedIn) {
    navigate('/expenses');
  }

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const accessToken = params.get('access_token');
      if (accessToken) {
        const doLogin = async () => {
          try {
            const response = await loginUser(dispatch, { access_token: accessToken });
            if (!response || !response.current_user) {
              return;
            }
            // Cleanup hash from URL
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
            navigate(`/expenses`);
          } catch (error) {
            console.log(error);
          }
        };
        doLogin();
      }
    }
  }, [dispatch, navigate]);

  const handleLogin = () => {
    setIsRedirecting(true);
    const googleAuthUrl =
      'https://accounts.google.com/o/oauth2/v2/auth?' +
      'client_id=954790461001-2p4vab8hud9u6mj4n6hb6iio4uaiofe5.apps.googleusercontent.com' +
      '&redirect_uri=' + encodeURIComponent(redirectUri) +
      '&response_type=token' +
      '&scope=' + encodeURIComponent('openid email profile');
    window.location.href = googleAuthUrl;
  };

  return (
    <div>
      <h4>Please login using Google in order to access app functionality.</h4>
      {errorMessage ? <p>We have some errors: {errorMessage}</p> : null}
      <button onClick={handleLogin} className="button wide" disabled={loading || isRedirecting}>
        {isRedirecting ? 'Redirecting…' : 'Log in'}
      </button>
    </div>
  );
};

export default Login;
