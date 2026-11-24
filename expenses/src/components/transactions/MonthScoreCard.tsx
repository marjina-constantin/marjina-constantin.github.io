import React from 'react';
import { Trophy } from 'lucide-react';
import { useMonthScore } from '../../ai/hooks/useMonthScore';

const MonthScoreCard: React.FC<{ month?: string }> = ({ month }) => {
  const { score, open, text, toggle } = useMonthScore(month);
  if (score === null) return null;

  return (
    <button
      type="button"
      className={`month-score${open ? ' is-open' : ''}`}
      onClick={toggle}
      aria-expanded={open}
      aria-label={`Score ${score}`}
    >
      <Trophy size={12} strokeWidth={2} aria-hidden />
      <span className="month-score__value">{score}</span>
      {open && (
        <span className="month-score__tip" role="status">
          {!text ? (
            <span className="month-score__wait">
              <span className="month-score__dots" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              Generating…
            </span>
          ) : (
            text
          )}
        </span>
      )}
    </button>
  );
};

export default MonthScoreCard;
