import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { monthKeyLabel } from '../../ai/monthReport';
import { useMonthReport } from '../../ai/hooks/useMonthReport';

const MonthCloseCard: React.FC<{
  month: string;
  onDismiss: () => void;
}> = ({ month, onDismiss }) => {
  const { narrative, busy } = useMonthReport(month);
  const label = monthKeyLabel(month);

  return (
    <aside className="month-close-card">
      <div className="month-close-card__icon" aria-hidden>
        <Sparkles size={18} />
      </div>
      <div className="month-close-card__body">
        <p className="month-close-card__kicker">{label} closed</p>
        <p className={`month-close-card__headline${busy && !narrative ? ' is-waiting' : ''}`}>
          {narrative?.headline || 'Your month in one page.'}
        </p>
        <NavLink to={`/expenses/report?month=${month}`} className="button month-close-card__cta">
          View report
        </NavLink>
      </div>
      <button
        type="button"
        className="month-close-card__dismiss"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </aside>
  );
};

export default MonthCloseCard;
