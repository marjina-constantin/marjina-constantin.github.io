import React, {createContext, useContext, useState} from 'react';
import Notification from '../components/Notification';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({children}) => {
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type) => {
    setNotification({message, type});

    // Clear the notification after a certain duration (e.g., 3 seconds)
    setTimeout(() => {
      setNotification(null);
    }, 2000);
  };

  return (
    <NotificationContext.Provider value={showNotification}>
      {children}
      {notification && (
        <Notification message={notification.message} type={notification.type}/>
      )}
    </NotificationContext.Provider>
  );
};
