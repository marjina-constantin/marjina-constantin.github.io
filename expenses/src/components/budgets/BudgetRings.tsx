import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useDataFetcher } from '../../hooks/useDataFetcher';
import { getAiItems, localToday } from '../../ai/data';
import {
  BudgetRing,
  BudgetWindow,
  budgetChoices,
  budgetHostMonth,
  budgetStatus,
  budgetUnlockLabel,
  buildBudgetBaseline,
  buildBudgets,
  countCompleteExpenseMonths,
  monthKeyLabel,
  monthPace,
  summarizeBudgets,
} from '../../budgets/model';
import { monthNames } from '../../utils/constants';
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

const RADIUS = 28;
const CENTER = 36;

const paceTick = (pace: number) => {
  const angle = 2 * Math.PI * pace;
  const point = (r: number) => ({
    x: CENTER + r * Math.cos(angle),
    y: CENTER + r * Math.sin(angle),
  });
  const inner = point(RADIUS - 5);
  const outer = point(RADIUS + 5);
  return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
};

const remainingText = (left: number) =>
  left >= 0 ? `${formatNumber(left)} left` : `${formatNumber(-left)} over`;

const Ring: React.FC<{
  ring: BudgetRing;
  pace: number;
  tip: boolean;
  onShowTip: (id: string, hold: boolean) => void;
  onHideTip: (id: string) => void;
}> = ({ ring, pace, tip, onShowTip, onHideTip }) => {
  const circumference = 2 * Math.PI * RADIUS;
  const animated = useAnimatedRatio(Math.max(0, ring.ratio));
  const shown = Math.min(animated, 1);
  const status = budgetStatus(animated, pace);
  const percent = Math.round(animated * 100);
  const showPace = pace < 1;

  return (
    <button
      type="button"
      className={`budget-ring is-${status}`}
      data-ring-id={ring.id}
      aria-label={`${ring.label}: ${formatNumber(ring.spent)} of ${formatNumber(ring.budget)} average, ${percent}%, ${remainingText(ring.left)}`}
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
          <circle className="budget-ring__track" cx={CENTER} cy={CENTER} r={RADIUS} />
          <circle
            className="budget-ring__value"
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - shown)}
          />
          {showPace && <line className="budget-ring__pace" {...paceTick(pace)} />}
        </svg>
        <span className="budget-ring__pct">{percent}%</span>
        {tip && (
          <span className="budget-ring__tip" role="status">
            <strong>{ring.label}</strong>
            <span>
              {formatNumber(ring.spent)} of {formatNumber(ring.budget)}
            </span>
            <span className="budget-ring__tip-left">{remainingText(ring.left)}</span>
          </span>
        )}
      </span>
      <span className="budget-ring__label">{ring.label}</span>
    </button>
  );
};

const SummaryBar: React.FC<{ ratio: number; pace: number }> = ({ ratio, pace }) => {
  const animated = useAnimatedRatio(ratio);
  const status = budgetStatus(animated, pace);
  return (
    <div className={`budget-card__bar is-${status}`} aria-hidden>
      <span className="budget-card__bar-fill" style={{ width: `${Math.min(animated, 1) * 100}%` }} />
      {pace < 1 && <span className="budget-card__bar-pace" style={{ left: `${pace * 100}%` }} />}
    </div>
  );
};

const BudgetRings: React.FC<{ monthLabel?: string }> = ({ monthLabel }) => {
  const { data } = useDataFetcher();
  const hostMonth = budgetHostMonth(Object.keys(data.groupedData || {}), new Date());
  const visible = !data.filtered && !!monthLabel && monthLabel === hostMonth;
  const items = useMemo(() => getAiItems(data.raw || []), [data.raw]);
  const today = localToday();
  const pace = monthPace(today);
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
  const summary = useMemo(() => summarizeBudgets(rings), [rings]);
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [tipId, setTipId] = useState<string | null>(null);
  const tipTimer = useRef<number | null>(null);
  const ringsRef = useRef<HTMLDivElement>(null);
  const positions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const shown = showAll ? rings : rings.slice(0, 8);
  const orderKey = shown.map((ring) => ring.id).join('|');

  useLayoutEffect(() => {
    const root = ringsRef.current;
    if (!root || !open) {
      positions.current = new Map();
      return;
    }
    const origin = root.getBoundingClientRect();
    const nodes = [...root.querySelectorAll<HTMLElement>('[data-ring-id]')];
    const next = new Map<string, { x: number; y: number }>();
    const animate = !prefersReducedMotion();
    for (const node of nodes) {
      const id = node.dataset.ringId || '';
      const rect = node.getBoundingClientRect();
      const position = { x: rect.left - origin.left, y: rect.top - origin.top };
      const previous = positions.current.get(id);
      next.set(id, position);
      if (!animate || !previous) continue;
      const dx = previous.x - position.x;
      const dy = previous.y - position.y;
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

  const currentMonthName = monthNames[Number(today.slice(5, 7)) - 1];
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
  const unbudgeted = baseline?.unbudgeted || [];

  return (
    <section className="budget-home">
      <div className={`budget-card${open ? ' is-open' : ''}`}>
        <button
          type="button"
          className="budget-card__toggle"
          aria-expanded={open}
          aria-controls="monthly-budgets-panel"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="budget-card__heading">
            <span className="budget-card__title">{currentMonthName} budgets</span>
            {rings.length > 0 ? (
              <span className="budget-card__meta">
                <span>
                  <strong>{formatNumber(summary.spent)}</strong> of {formatNumber(summary.budget)}
                </span>
                {summary.over > 0 && (
                  <span className="budget-card__chip is-over">{summary.over} over</span>
                )}
              </span>
            ) : (
              <span className="budget-card__meta">
                {options.length ? 'No suggestions yet' : `Unlocks ${budgetUnlockLabel(today)}`}
              </span>
            )}
          </span>
          <ChevronDown size={18} className={`budget-card__chevron${open ? ' is-open' : ''}`} aria-hidden />
        </button>
        {rings.length > 0 && <SummaryBar ratio={summary.ratio} pace={pace} />}
        <div id="monthly-budgets-panel" className={`budget-card__panel${open ? ' is-open' : ''}`}>
          <div className="budget-card__panel-inner">
            {rings.length === 0 ? (
              <p className="budget-card__note">{emptyMessage}</p>
            ) : (
              <>
                <div className="budget-card__tools">
                  <p className="budget-card__note">
                    {note}
                    {pace < 1 && (
                      <span className="budget-card__legend">
                        <span className="budget-card__legend-tick" aria-hidden />
                        Today's mark at a steady pace
                      </span>
                    )}
                  </p>
                  {options.length > 1 && (
                    <div className="budget-segment" role="group" aria-label="Months in the average">
                      {options.map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={value === windowSize ? 'is-on' : ''}
                          aria-pressed={value === windowSize}
                          onClick={() => setPicked(value)}
                        >
                          {value} mo
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="budget-rings" ref={ringsRef}>
                  {shown.map((ring) => (
                    <Ring
                      key={ring.id}
                      ring={ring}
                      pace={pace}
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
                {unbudgeted.length > 0 && (
                  <p className="budget-card__extra">
                    No history yet:{' '}
                    {unbudgeted
                      .map((entry) => `${entry.label} ${formatNumber(entry.spent)}`)
                      .join(', ')}
                  </p>
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
