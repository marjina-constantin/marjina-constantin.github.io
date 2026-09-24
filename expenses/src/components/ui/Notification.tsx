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
      <Icon size={18} strokeWidth={1.75} aria-hidden />
      <span>{message}</span>
    </div>
  );
};

export default Notification;
