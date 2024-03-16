import React, { useEffect, useState } from 'react';
import { formatNumber } from '../utils/utils';

interface NumberDisplayProps {
  number: number;
}

const NumberDisplay: React.FC<NumberDisplayProps> = ({ number }) => {
  const [displayedNumber, setDisplayedNumber] = useState(0);
  const transitionTime = 10;
  const steps = Math.abs(number - displayedNumber);
  const intervalDuration = transitionTime / steps;

  useEffect(() => {
    if (number !== displayedNumber) {
      const intervalId = setInterval(() => {
        setDisplayedNumber((prevNumber) => {
          const diff = Math.abs(number - prevNumber);
          let step;
          switch (true) {
            case diff > 10000:
              step = 5000;
              break;
            case diff > 1000:
              step = 500;
              break;
            case diff > 100:
              step = 50;
              break;
            case diff > 10:
              step = 5;
              break;
            default:
              step = 1;
          }
          if (prevNumber < number) {
            return Math.min(prevNumber + step, number);
          } else if (prevNumber > number) {
            return Math.max(prevNumber - step, number);
          }
          clearInterval(intervalId);
          return prevNumber;
        });
      }, intervalDuration);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [number]);

  return <div>{formatNumber(displayedNumber)}</div>;
};

export default NumberDisplay;
