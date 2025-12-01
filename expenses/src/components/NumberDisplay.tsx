import React, { useEffect, useRef, useState } from 'react';
import { formatNumber } from '../utils/utils';

const BASE_DURATION = 300;
const MAX_DURATION = 300;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

interface NumberDisplayProps {
  number: number;
}

const NumberDisplay: React.FC<NumberDisplayProps> = ({ number }) => {
  const [displayedNumber, setDisplayedNumber] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const displayedValueRef = useRef(displayedNumber);
  displayedValueRef.current = displayedNumber;

  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const startValue = displayedValueRef.current;
    const diff = number - startValue;

    if (diff === 0) {
      return;
    }

    const duration = Math.min(
      MAX_DURATION,
      BASE_DURATION + Math.log10(Math.abs(diff) + 1) * 250
    );
    const startTime = performance.now();

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const nextValue = startValue + diff * easedProgress;
      const roundedValue =
        progress < 1 ? Math.round(nextValue) : Math.round(number);

      setDisplayedNumber(roundedValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [number]);

  return <div>{formatNumber(displayedNumber)}</div>;
};

export default NumberDisplay;
