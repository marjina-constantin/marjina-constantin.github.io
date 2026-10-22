import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useDataFetcher } from '../../hooks/useDataFetcher';
import { getAiItems, localToday } from '../../ai/data';
import {
  BudgetRing,
  BudgetWindow,
  budgetChoices,
  budgetUnlockLabel,
  buildBudgetBaseline,
  buildBudgets,
  calendarMonthLabel,
  countCompleteExpenseMonths,
  latestMonthLabel,
  monthKeyLabel,
} from '../../budgets/model';
import { formatNumber } from '../../utils/utils';

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const useAnimatedRatio = (ratio: number) => {
  const [value, setValue] = useState(ratio);
  const valueRef = useRef(ratio);

  useEffect(() => {
    const from = valueRef.current;
    if (prefersReducedMotion() || Math.abs(from - ratio) < 0.0005) {
      valueRef.current = ratio;
      setValue(ratio);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 560);
      const eased = 1 - (1 - t) ** 3;
      const next = from + (ratio - from) * eased;
      valueRef.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ratio]);

  return value;
};

const Ring: React.FC<{
  ring: BudgetRing;
  tip: boolean;
  onShowTip: (id: string, hold: boolean) => void;
  onHideTip: (id: string) => void;
}> = ({ ring, tip, onShowTip, onHideTip }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const animated = useAnimatedRatio(Math.max(0, ring.ratio));
  const shown = Math.min(animated, 1);
  const over = animated > 1.001;
  const percent = Math.round(animated * 100);

  return (
    <button
      type="button"
      className={`budget-ring${over ? ' is-over' : ''}`}
      data-ring-id={ring.id}
      aria-label={`${ring.label}: ${formatNumber(ring.spent)} of ${formatNumber(ring.budget)} average, ${percent}%`}
      onPointerDown={(event) => {
        if (event.pointerType === 'mouse') onShowTip(ring.id, false);
      }}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') onShowTip(ring.id, false);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') onHideTip(ring.id);
      }}
      onFocus={() => onShowTip(ring.id, false)}
      onBlur={() => onHideTip(ring.id)}
      onClick={(event) => {
        if (event.detail === 0) return;
        const pointerType = (event.nativeEvent as PointerEvent).pointerType;
        onShowTip(ring.id, pointerType !== 'mouse');
      }}
    >
      <span className="budget-ring__dial">
        <svg viewBox="0 0 72 72" aria-hidden>
          <circle className="budget-ring__track" cx="36" cy="36" r={radius} />
          <circle
            className="budget-ring__value"
            cx="36"
            cy="36"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - shown)}
          />
        </svg>
        <span className="budget-ring__pct">{percent}%</span>
        {tip && (
          <span className="budget-ring__tip" role="status">
            <strong>{ring.label}</strong>
            {formatNumber(ring.spent)} of {formatNumber(ring.budget)}
          </span>
        )}
      </span>
      <span className="budget-ring__label">{ring.label}</span>
    </button>
  );
};

const BudgetRings: React.FC<{ monthLabel?: string; monthLabels: string[] }> = ({
  monthLabel,
  monthLabels,
}) => {
  const todayLabel = calendarMonthLabel(new Date());
  const latest = latestMonthLabel(monthLabels);
  const visible =
    monthLabel === todayLabel || (monthLabel === latest && !monthLabels.includes(todayLabel));
  const { data } = useDataFetcher();
  const items = useMemo(() => getAiItems(data.raw || []), [data.raw]);
  const today = localToday();
  const completeMonths = useMemo(
    () => countCompleteExpenseMonths(items, today),
    [items, today]
  );
  const { options, defaultWindow } = budgetChoices(completeMonths);
  const [picked, setPicked] = useState<BudgetWindow | null>(null);
  const windowSize = picked && options.includes(picked) ? picked : defaultWindow;
  const baseline = useMemo(
    () => (visible && options.length ? buildBudgetBaseline(items, today, windowSize) : null),
    [items, today, windowSize, visible, options.length]
  );
  const rings = useMemo(() => (baseline ? buildBudgets(baseline) : []), [baseline]);
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [tipId, setTipId] = useState<string | null>(null);
  const tipTimer = useRef<number | null>(null);
  const ringsRef = useRef<HTMLDivElement>(null);
  const positions = useRef<Map<string, DOMRect>>(new Map());
  const shown = showAll ? rings : rings.slice(0, 8);
  const orderKey = shown.map((ring) => ring.id).join('|');

  useLayoutEffect(() => {
    const root = ringsRef.current;
    if (!root || !open) return;
    const nodes = [...root.querySelectorAll<HTMLElement>('[data-ring-id]')];
    const next = new Map<string, DOMRect>();
    const animate = !prefersReducedMotion();
    for (const node of nodes) {
      const id = node.dataset.ringId || '';
      const rect = node.getBoundingClientRect();
      const previous = positions.current.get(id);
      next.set(id, rect);
      if (!animate || !previous) continue;
      const dx = previous.left - rect.left;
      const dy = previous.top - rect.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      node.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
        { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
    }
    positions.current = next;
  }, [orderKey, open]);

  useEffect(
    () => () => {
      if (tipTimer.current) window.clearTimeout(tipTimer.current);
    },
    []
  );

  const showTip = (id: string, hold: boolean) => {
    if (tipTimer.current) window.clearTimeout(tipTimer.current);
    setTipId(id);
    if (!hold) return;
    tipTimer.current = window.setTimeout(() => setTipId(null), 1600);
  };

  const hideTip = (id: string) => {
    if (tipTimer.current) window.clearTimeout(tipTimer.current);
    setTipId((current) => (current === id ? null : current));
  };

  if (!visible) return null;

  const monthCount = baseline?.months.length || windowSize;
  const sourceMonth = baseline?.months[baseline.months.length - 1];
  const note =
    completeMonths < 3 && sourceMonth
      ? `${monthKeyLabel(today.slice(0, 7))} is based on ${monthKeyLabel(sourceMonth)}, your last completed month.`
      : `Average of your last ${monthCount} completed ${monthCount === 1 ? 'month' : 'months'}.`;
  const hasCurrentExpenses = items.some(
    (item) => item.kind === 'expense' && item.month === today.slice(0, 7)
  );
  const emptyMessage = options.length
    ? 'Not enough spending in your last completed months to suggest budgets.'
    : hasCurrentExpenses
      ? `Not enough history yet. Monthly budgets unlock on ${budgetUnlockLabel(today)}, after this month closes.`
      : `Not enough history yet. Add expenses this month - monthly budgets unlock on ${budgetUnlockLabel(today)}, after the month closes.`;

  return (
    <section className="budget-home">
      <div className="budget-card">
        <button
          type="button"
          className="budget-card__toggle"
          aria-expanded={open}
          aria-controls="monthly-budgets-panel"
          onClick={() => setOpen((value) => !value)}
        >
          <span>Monthly budgets</span>
          <ChevronDown size={18} className={open ? 'is-open' : ''} aria-hidden />
        </button>
        <div id="monthly-budgets-panel" className={`budget-card__panel${open ? ' is-open' : ''}`}>
          <div className="budget-card__panel-inner">
            {rings.length === 0 ? (
              <p className="budget-card__note">{emptyMessage}</p>
            ) : (
              <>
                <div className="budget-card__tools">
                  <p className="budget-card__note">{note}</p>
                  <div className="budget-segment" role="group" aria-label="Months in the average">
                    {options.map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={value === windowSize ? 'is-on' : ''}
                        aria-pressed={value === windowSize}
                        onClick={() => setPicked(value)}
                      >
                        {value === 1 ? '1 mo' : `${value} mo`}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="budget-rings" ref={ringsRef}>
                  {shown.map((ring) => (
                    <Ring
                      key={ring.id}
                      ring={ring}
                      tip={tipId === ring.id}
                      onShowTip={showTip}
                      onHideTip={hideTip}
                    />
                  ))}
                </div>
                {rings.length > 8 && (
                  <button
                    type="button"
                    className="budget-text-btn"
                    onClick={() => setShowAll((value) => !value)}
                  >
                    {showAll ? 'Show fewer' : `Show all (${rings.length})`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BudgetRings;
