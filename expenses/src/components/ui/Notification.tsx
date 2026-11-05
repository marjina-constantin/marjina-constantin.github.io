import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: string;
}

/**
 * Animated 470ms chained success icon ("Draw the win"):
 * 1) Outer circle draws first (0 -> 250ms)
 * 2) Checkmark tick draws next (230ms -> 470ms)
 */
export const SuccessTickIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg
    className="success-tick-svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      className="success-tick-svg__circle"
      cx="12"
      cy="12"
      r="9.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      className="success-tick-svg__check"
      d="M8 12.4L10.8 15.2L16.2 9.5"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Notification: React.FC<NotificationProps> = ({ message, type }) => {
  if (!message) return null;

  const isError = type === 'error';

  return (
    <div
      className={`notification ${type}`}
      role={isError ? 'alert' : 'status'}
    >
      <span className="notification__icon">
        {isError ? (
          <AlertTriangle size={16} strokeWidth={1.75} aria-hidden />
        ) : (
          <SuccessTickIcon size={18} />
        )}
      </span>
      <span className="notification__message">{message}</span>
    </div>
  );
};

export default Notification;
