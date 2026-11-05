import React, { useEffect, useState } from 'react';
import { formatNumber } from '../../utils/utils';

interface NumberDisplayProps {
  number: number;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Rolling odometer number display ("Roll, don't jump"):
 * Keyed from the right (ones, tens, hundreds...) so when the total number of
 * digits changes between months (e.g. 2,895 -> 14,520), existing columns stay
 * mounted and roll smoothly instead of remounting without animation.
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
  const totalDigits = chars.filter((c) => c >= '0' && c <= '9').length;
  let digitOrderFromLeft = 0;

  return (
    <div className="rolling-number" aria-label={formatted}>
      <span className="rolling-number__sr">{formatted}</span>
      <span className="rolling-number__track" aria-hidden="true">
        {chars.map((char, idx) => {
          const isDigit = char >= '0' && char <= '9';
          if (!isDigit) {
            const placeFromRight = chars.length - 1 - idx;
            return (
              <span key={`sep-r${placeFromRight}`} className="rolling-number__sep">
                {char}
              </span>
            );
          }

          const digitValue = Number(char);
          const staggerIndex = digitOrderFromLeft++;
          const placeFromRight = totalDigits - staggerIndex;
          const targetDigit = armed ? digitValue : 0;

          return (
            <span key={`digit-r${placeFromRight}`} className="rolling-number__col">
              <span
                className="rolling-number__reel"
                style={{
                  transform: `translateY(-${targetDigit * 10}%)`,
                  transitionDelay: `${staggerIndex * 70}ms`,
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
