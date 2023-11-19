import React, {useEffect, useState} from "react";

const NumberDisplay = ({ number }) => {
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
              step = 3000;
              break;
            case diff > 1000:
              step = 300;
              break;
            case diff > 100:
              step = 30;
              break;
            case diff > 10:
              step = 3;
              break;
            default:
              step = 1;
          }
          if (prevNumber < number) {
            return Math.min(prevNumber + step, number);
          } else if (prevNumber > number) {
            return Math.max(prevNumber - step, number);
          }
          return prevNumber;
        });
      }, intervalDuration);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [number]);

  return <div>{displayedNumber}</div>;
};

export default NumberDisplay;
