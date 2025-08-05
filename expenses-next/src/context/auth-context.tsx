'use client';

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { AuthState } from '@/types';

interface AuthContextType {
  state: AuthState;
  dispatch: React.Dispatch<any>;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  token: '',
  value: null,
  theme: 'bondi-blue',
  currency: 'USD',
  weeklyBudget: '',
  monthlyBudget: '',
  userIsLoggedIn: false,
  loading: false,
  errorMessage: null,
  userDetails: '',
};

type AuthAction =
  | { type: 'LOGIN'; payload: { token: string; userDetails: any } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AuthState> }
  | { type: 'INITIALIZE_FROM_STORAGE'; payload: AuthState };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        token: action.payload.token,
        userDetails: action.payload.userDetails,
        userIsLoggedIn: true,
        loading: false,
        errorMessage: null,
      };
    case 'LOGOUT':
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
      }
      return {
        ...initialState,
        theme: state.theme,
        currency: state.currency,
        weeklyBudget: state.weeklyBudget,
        monthlyBudget: state.monthlyBudget,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        errorMessage: action.payload,
        loading: false,
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        ...action.payload,
      };
    case 'INITIALIZE_FROM_STORAGE':
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage only on client side after hydration
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      const user = localStorage.getItem('currentUser')
        ? JSON.parse(localStorage.getItem('currentUser')!)
        : '';
      const token = localStorage.getItem('currentUser')
        ? JSON.parse(localStorage.getItem('currentUser')!).jwt_token
        : '';
      const theme = localStorage.getItem('theme')
        ? JSON.parse(localStorage.getItem('theme')!)
        : 'bondi-blue';
      const weeklyBudget = localStorage.getItem('weeklyBudget')
        ? JSON.parse(localStorage.getItem('weeklyBudget')!)
        : '';
      const monthlyBudget = localStorage.getItem('monthlyBudget')
        ? JSON.parse(localStorage.getItem('monthlyBudget')!)
        : '';

      dispatch({
        type: 'INITIALIZE_FROM_STORAGE',
        payload: {
          token: token || '',
          value: null,
          theme: theme || 'bondi-blue',
          currency: user?.current_user?.currency || 'USD',
          weeklyBudget: weeklyBudget || '',
          monthlyBudget: monthlyBudget || '',
          userIsLoggedIn: !!user,
          loading: false,
          errorMessage: null,
          userDetails: user?.current_user || '',
        },
      });
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Save settings to localStorage when they change (using same keys as original app)
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      if (state.theme) localStorage.setItem('theme', JSON.stringify(state.theme));
      if (state.currency) localStorage.setItem('currency', JSON.stringify(state.currency));
      if (state.weeklyBudget) localStorage.setItem('weeklyBudget', JSON.stringify(state.weeklyBudget));
      if (state.monthlyBudget) localStorage.setItem('monthlyBudget', JSON.stringify(state.monthlyBudget));
      
      // Save user data in the same format as original app
      if (state.token && state.userDetails) {
        const userData = {
          jwt_token: state.token,
          current_user: state.userDetails,
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));
      }
    }
  }, [state.theme, state.currency, state.weeklyBudget, state.monthlyBudget, state.token, state.userDetails, isInitialized]);

  return (
    <AuthContext.Provider value={{ state, dispatch, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 