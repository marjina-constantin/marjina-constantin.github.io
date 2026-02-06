import React from 'react';

interface NotificationProps {
  message: string;
  type: string;
}

const Notification: React.FC<NotificationProps> = ({ message, type }) => (
  <div className={`notification ${type}`}>{message}</div>
);

export default Notification;
