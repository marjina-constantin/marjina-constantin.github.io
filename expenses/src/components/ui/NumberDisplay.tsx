import React, { useEffect, useState } from 'react';
import { formatNumber } from '../../utils/utils';

interface NumberDisplayProps {
  number: number;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Rolling odometer number display ("Roll, don't jump"):
 * Each digit column rolls vertically into place on an S-curve,
 * staggered 100ms apart from left to right.
 */
const NumberDisplay: React.FC<NumberDisplayProps> = ({ number }) => {
  const formatted = formatNumber(Math.round(number));
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setArmed(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const chars = Array.from(formatted);
  let digitOrder = 0;

  return (
    <div className="rolling-number" aria-label={formatted}>
      <span className="rolling-number__sr">{formatted}</span>
      <span className="rolling-number__track" aria-hidden="true">
        {chars.map((char, idx) => {
          const isDigit = char >= '0' && char <= '9';
          if (!isDigit) {
            return (
              <span key={`sep-${idx}`} className="rolling-number__sep">
                {char}
              </span>
            );
          }

          const digitValue = Number(char);
          const staggerIndex = digitOrder++;
          const targetDigit = armed ? digitValue : 0;

          return (
            <span key={`col-${idx}-${ chars.length }`} className="rolling-number__col">
              <span
                className="rolling-number__reel"
                style={{
                  transform: `translateY(-${targetDigit * 10}%)`,
                  transitionDelay: `${staggerIndex * 100}ms`,
                }}
              >
                {DIGITS.map((d) => (
                  <span key={d} className="rolling-number__digit">
                    {d}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </div>
  );
};

export default NumberDisplay;
