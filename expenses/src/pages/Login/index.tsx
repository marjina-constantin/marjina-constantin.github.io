import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { loginUser, useAuthDispatch, useAuthState } from '../../context';
import { useNavigate } from 'react-router-dom';
import { AuthState } from '../../types/types';

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
    <div className="login-page">
      <div className="login-panel">
        <h1>Sign in</h1>
        <p className="login-description">
          Use your Google account to open your expenses.
        </p>
        {errorMessage && (
          <div className="login-error" role="alert">
            <span className="login-error__icon">
              <AlertTriangle size={16} strokeWidth={1.75} aria-hidden />
            </span>
            <p>{errorMessage}</p>
          </div>
        )}
        <button
          onClick={handleLogin}
          className="login-button"
          disabled={loading || isRedirecting}
        >
          <svg
            className="login-button__mark"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            aria-hidden
          >
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"
            />
          </svg>
          {isRedirecting ? 'Redirecting…' : 'Continue with Google'}
        </button>
      </div>
    </div>
  );
};

export default Login;
