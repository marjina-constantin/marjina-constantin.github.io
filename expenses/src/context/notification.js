import React, {createContext, useContext, useState} from 'react';
import Notification from '../components/Notification';
import {notificationType} from '../utils/constants';
import {useAuthState} from "./context";

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({children}) => {
  const [notification, setNotification] = useState(null);
  const { theme } = useAuthState();
  const gradientClass = theme === 'dj-alik' ? 'has-gradient-accent' : '';

  const showNotification = (message, type) => {
    setNotification({message, type});
    let timeout = 2000;
    if (type === notificationType.ERROR) {
      // increase it to have time to read ))
      timeout = 4000;
    }

    // Clear the notification after a certain duration (e.g., 3 seconds)
    setTimeout(() => {
      setNotification(null);
    }, timeout);
  };

  return (
    <div className={`${theme} ${gradientClass}`}>
      <NotificationContext.Provider value={showNotification}>
        {children}
        {notification && (
          <Notification message={notification.message} type={notification.type}/>
        )}
      </NotificationContext.Provider>
    </div>
  );
};
