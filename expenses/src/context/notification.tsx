import React, { createContext, useContext, useState, ReactNode } from 'react';
import Notification from '../components/Notification';
import { notificationType, themeList } from '../utils/constants';
import { useAuthState } from './context';
import { AuthState } from '../type/types';

interface NotificationContextProps {
  children: ReactNode;
}

const NotificationContext = createContext<
  (message: string, type: string) => void
>(() => {});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({
  children,
}: NotificationContextProps) => {
  const [notification, setNotification] = useState({ message: '', type: '' });
  let { theme } = useAuthState() as AuthState;
  // @ts-expect-error TBC
  theme = themeList[theme] ? theme : 'blue-pink-gradient';
  const gradientClass =
    theme === 'blue-pink-gradient' ? 'has-gradient-accent' : '';

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    let timeout = 2000;
    if (type === notificationType.ERROR) {
      // increase it to have time to read ))
      timeout = 4000;
    }

    // Clear the notification after a certain duration (e.g., 3 seconds)
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, timeout);
  };

  return (
    <div className={`${theme} ${gradientClass}`}>
      <NotificationContext.Provider value={showNotification}>
        {children}
        {notification && (
          <Notification
            message={notification!.message}
            type={notification!.type}
          />
        )}
      </NotificationContext.Provider>
    </div>
  );
};
