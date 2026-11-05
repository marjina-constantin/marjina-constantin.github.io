import React, { useEffect, useRef, useState } from 'react';

interface PullToRefreshProps {
  onRefresh: () => void | Promise<void>;
  children: React.ReactNode;
}

const RESISTANCE = 0.35; // Finger moves 100% -> list moves 35%
const TRIGGER_DISTANCE = 54; // Damped px required to trigger refresh
const MAX_PULL = 96;
const TOP_SLOP = 4;

const scrollTop = () =>
  window.scrollY ||
  document.documentElement.scrollTop ||
  document.body.scrollTop ||
  0;

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const pullingRef = useRef(false);
  const pullOffsetRef = useRef(0);
  const refreshingRef = useRef(false);

  const [pullOffset, setPullOffset] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);

  const setOffset = (value: number) => {
    pullOffsetRef.current = value;
    setPullOffset(value);
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let tracking = false;
    let startY = 0;
    let startX = 0;

    const nestedScrolled = (target: EventTarget | null) => {
      let node = target instanceof Element ? target : null;
      while (node && node !== root) {
        const overflowY = window.getComputedStyle(node).overflowY;
        if (/(auto|scroll)/.test(overflowY) && node.scrollTop > TOP_SLOP) return true;
        node = node.parentElement;
      }
      return false;
    };

    const blockedTarget = (target: EventTarget | null) => {
      const node = target instanceof Element ? target : null;
      return !!node?.closest('.modal-window, .biometric-lock');
    };

    const onTouchStart = (event: TouchEvent) => {
      if (
        refreshingRef.current ||
        event.touches.length !== 1 ||
        scrollTop() > TOP_SLOP ||
        blockedTarget(event.target) ||
        nestedScrolled(event.target)
      ) {
        tracking = false;
        return;
      }
      const touch = event.touches[0];
      if (!touch) return;
      tracking = true;
      startY = touch.clientY;
      startX = touch.clientX;
      pullingRef.current = false;
      setIsReleasing(false);
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!tracking || refreshingRef.current) return;
      if (event.touches.length !== 1) {
        tracking = false;
        if (pullingRef.current) {
          pullingRef.current = false;
          setOffset(0);
        }
        return;
      }

      const touch = event.touches[0];
      if (!touch) return;

      const deltaY = touch.clientY - startY;
      const deltaX = Math.abs(touch.clientX - startX);

      if (!pullingRef.current) {
        // Horizontal row swipes and upward scrolling stay with the browser.
        if (deltaX > deltaY || deltaY <= 0) {
          if (deltaY < -4 || deltaX > 12) tracking = false;
          return;
        }
        if (scrollTop() > TOP_SLOP) {
          tracking = false;
          return;
        }
        // React's onTouchMove is passive, so preventDefault there is ignored
        // and Chrome/Safari still run their own pull-to-refresh on top.
        if (event.cancelable) event.preventDefault();
        if (deltaY < 8) return;
        pullingRef.current = true;
      } else if (event.cancelable) {
        event.preventDefault();
      }

      if (deltaY <= 0) {
        setOffset(0);
        return;
      }

      setOffset(Math.min(MAX_PULL, deltaY * RESISTANCE));
    };

    const onTouchEnd = () => {
      if (!tracking && !pullingRef.current) return;
      tracking = false;

      if (!pullingRef.current) return;
      pullingRef.current = false;
      setIsReleasing(true);

      if (pullOffsetRef.current >= TRIGGER_DISTANCE && !refreshingRef.current) {
        refreshingRef.current = true;
        setIsRefreshing(true);
        setOffset(42);
        Promise.resolve(onRefreshRef.current()).finally(() => {
          window.setTimeout(() => {
            refreshingRef.current = false;
            setIsRefreshing(false);
            setOffset(0);
          }, 420);
        });
      } else {
        setOffset(0);
      }
    };

    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchmove', onTouchMove, { passive: false });
    root.addEventListener('touchend', onTouchEnd);
    root.addEventListener('touchcancel', onTouchEnd);

    return () => {
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove);
      root.removeEventListener('touchend', onTouchEnd);
      root.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  const progress = Math.min(1, pullOffset / TRIGGER_DISTANCE);
  const ready = progress >= 1;
  const radius = 11;
  const circumference = 2 * Math.PI * radius;

  return (
    <div ref={rootRef} className="pull-to-refresh">
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
