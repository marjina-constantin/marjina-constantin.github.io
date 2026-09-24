import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: string;
}

const Notification: React.FC<NotificationProps> = ({ message, type }) => {
  if (!message) return null;

  const Icon = type === 'error' ? AlertTriangle : Check;

  return (
    <div
      className={`notification ${type}`}
      role={type === 'error' ? 'alert' : 'status'}
    >
      <span className="notification__icon">
        <Icon size={16} strokeWidth={1.75} aria-hidden />
      </span>
      <span className="notification__message">{message}</span>
    </div>
  );
};

export default Notification;
