import React from 'react';
import { Trophy } from 'lucide-react';
import { useMonthScore } from '../../ai/hooks/useMonthScore';
import NumberDisplay from '../ui/NumberDisplay';

const MonthScoreCard: React.FC<{ month?: string }> = ({ month }) => {
  const { score, open, busy, text, toggle } = useMonthScore(month);
  if (score === null) return null;

  return (
    <button
      type="button"
      className={`stat-card stat-card--score${open ? ' is-open' : ''}`}
      onClick={toggle}
      aria-expanded={open}
      aria-label={`Score ${score}`}
    >
      <div className="stat-icon">
        <Trophy />
      </div>
      <div className="stat-value">
        <NumberDisplay number={score} />
      </div>
      <div className="stat-label">Score</div>
      {open && (
        <span className="stat-card-tip" role="status">
          {busy && !text ? (
            <span className="stat-card-tip__wait">
              <span className="stat-card-tip__dots" aria-hidden>
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
