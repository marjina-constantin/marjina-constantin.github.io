import React, { useRef, useState, useCallback } from 'react';

interface PullToRefreshProps {
  onRefresh: () => void | Promise<void>;
  children: React.ReactNode;
}

const RESISTANCE = 0.35; // Finger moves 100% -> list moves 35%
const TRIGGER_DISTANCE = 54; // Damped px required to trigger refresh
const MAX_PULL = 96;

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const startYRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const pullingRef = useRef(false);
  const [pullOffset, setPullOffset] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (isRefreshing) return;
      if (window.scrollY > 4) {
        startYRef.current = null;
        return;
      }
      const touch = e.touches[0];
      if (!touch) return;
      startYRef.current = touch.clientY;
      startXRef.current = touch.clientX;
      pullingRef.current = false;
      setIsReleasing(false);
    },
    [isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (isRefreshing || startYRef.current === null || startXRef.current === null) {
        return;
      }
      const touch = e.touches[0];
      if (!touch) return;

      const deltaY = touch.clientY - startYRef.current;
      const deltaX = Math.abs(touch.clientX - startXRef.current);

      if (!pullingRef.current) {
        if (deltaY < 8 || deltaX > deltaY || window.scrollY > 4) {
          if (deltaY < -4 || deltaX > 16) {
            startYRef.current = null;
          }
          return;
        }
        pullingRef.current = true;
      }

      if (deltaY <= 0) {
        setPullOffset(0);
        return;
      }

      const damped = Math.min(MAX_PULL, deltaY * RESISTANCE);
      setPullOffset(damped);
    },
    [isRefreshing]
  );

  const handleTouchEnd = useCallback(() => {
    if (!pullingRef.current) {
      startYRef.current = null;
      return;
    }
    pullingRef.current = false;
    startYRef.current = null;
    setIsReleasing(true);

    if (pullOffset >= TRIGGER_DISTANCE && !isRefreshing) {
      setIsRefreshing(true);
      setPullOffset(42);
      Promise.resolve(onRefresh()).finally(() => {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullOffset(0);
        }, 420);
      });
    } else {
      setPullOffset(0);
    }
  }, [pullOffset, isRefreshing, onRefresh]);

  const progress = Math.min(1, pullOffset / TRIGGER_DISTANCE);
  const ready = progress >= 1;
  const radius = 11;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className="pull-to-refresh"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`pull-to-refresh__indicator${
          pullOffset > 4 || isRefreshing ? ' is-visible' : ''
        }${ready ? ' is-ready' : ''}${isRefreshing ? ' is-refreshing' : ''}`}
        style={{
          transform: `translate3d(-50%, ${Math.min(pullOffset - 36, 26)}px, 0) scale(${
            0.6 + progress * 0.4
          })`,
          opacity: Math.min(1, pullOffset / 28),
        }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 28 28" className="pull-to-refresh__ring">
          <circle
            className="pull-to-refresh__track"
            cx="14"
            cy="14"
            r={radius}
          />
          <circle
            className="pull-to-refresh__fill"
            cx="14"
            cy="14"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - Math.max(0.08, progress))}
          />
        </svg>
      </div>
      <div
        className={`pull-to-refresh__content${isReleasing ? ' is-releasing' : ''}`}
        style={
          pullOffset > 0
            ? {
                transform: `translate3d(0, ${pullOffset}px, 0)`,
                willChange: 'transform',
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
