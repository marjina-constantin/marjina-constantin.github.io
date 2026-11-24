import React, { useEffect, useMemo } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Trophy,
  Wallet,
} from 'lucide-react';
import { useAuthState } from '../../context';
import { AuthState } from '../../types/types';
import { useDataFetcher } from '../../hooks/useDataFetcher';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/ui/StatCard';
import MonthReportChart from '../../components/reports/MonthReportChart';
import { getCategoryIcon, getCategoryTint } from '../../utils/categoryIcons';
import { useMonthReport } from '../../ai/hooks/useMonthReport';
import {
  buildLocalNarrative,
  closedExpenseMonths,
  isClosedMonth,
  isMonthKey,
  markMonthReportViewed,
  monthKeyLabel,
} from '../../ai/monthReport';
import { getAiItems } from '../../ai/data';

const StoryList: React.FC<{
  title: string;
  items: { label: string; text: string; id?: string }[];
  tone: 'good' | 'hot';
}> = ({ title, items, tone }) => {
  if (!items.length) return null;
  return (
    <section className={`month-report__stories month-report__stories--${tone}`}>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => {
          const Icon = getCategoryIcon(item.id);
          return (
            <li key={`${item.label}-${item.text}`}>
              <span
                className="month-report__cat"
                style={{ background: getCategoryTint(item.id) }}
                aria-hidden
              >
                <Icon size={16} />
              </span>
              <div>
                <strong>{item.label}</strong>
                <p>{item.text}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

const MonthReport = () => {
  const { loading, data } = useDataFetcher();
  const { currency } = useAuthState() as AuthState;
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const items = useMemo(() => getAiItems(data.raw || []), [data.raw]);
  const months = useMemo(() => closedExpenseMonths(items), [items]);
  const requested = params.get('month') || '';
  const month = isMonthKey(requested) && isClosedMonth(requested) ? requested : months[0] || '';
  const monthIndex = months.indexOf(month);
  const { facts, narrative, stale, busy, refresh } = useMonthReport(month || null);
  const copy = narrative || (facts ? buildLocalNarrative(facts) : null);

  useEffect(() => {
    if (month) markMonthReportViewed(month);
  }, [month]);

  useEffect(() => {
    if (!month || requested === month) return;
    navigate(`/expenses/report?month=${month}`, { replace: true });
  }, [month, navigate, requested]);

  const go = (next: string) => navigate(`/expenses/report?month=${next}`);

  const spentLabel =
    !facts || facts.vsAvg3Pct === null
      ? 'Spent'
      : `Spent · ${facts.vsAvg3Pct > 0 ? '+' : ''}${Math.round(facts.vsAvg3Pct)}% vs usual`;
  const savedLabel =
    !facts || facts.savingsRate === null
      ? 'Saved'
      : `Saved · ${Math.round(facts.savingsRate)}% of income`;

  const withIds = (
    rows: { label: string; text: string }[],
    source: { label: string; id: string }[]
  ) =>
    rows.map((row) => ({
      ...row,
      id: source.find((item) => item.label === row.label)?.id,
    }));

  return (
    <div className="month-report">
      <div className="month-report__top">
        <NavLink to="/expenses" className="month-report__back" aria-label="Back to expenses">
          <ArrowLeft size={18} />
        </NavLink>
        <div className="month-report__pager">
          <button
            type="button"
            disabled={monthIndex < 0 || monthIndex >= months.length - 1}
            onClick={() => go(months[monthIndex + 1])}
            aria-label="Older month"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="page-title">{month ? monthKeyLabel(month) : 'Month report'}</h2>
          <button
            type="button"
            disabled={monthIndex <= 0}
            onClick={() => go(months[monthIndex - 1])}
            aria-label="Newer month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {loading && <PageLoader />}

      {!loading && !month && (
        <p className="month-report__empty">
          The report appears after your first month closes.
        </p>
      )}

      {!loading && month && facts && copy && (
        <>
          <p className="month-report__headline">{copy.headline}</p>

          <div className="stats-grid month-report__stats">
            <StatCard icon={<Wallet />} value={facts.spent} label={spentLabel} />
            <StatCard
              icon={facts.saved >= 0 ? <TrendingUp /> : <TrendingDown />}
              value={facts.saved}
              label={savedLabel}
            />
            <StatCard icon={<Trophy />} value={facts.score} label="Score" />
          </div>
          <p className="month-report__score-why">{copy.scoreWhy}</p>

          {stale && (
            <button type="button" className="month-report__stale" onClick={refresh} disabled={busy}>
              <RefreshCw size={14} />
              Numbers changed. Refresh story
            </button>
          )}

          <div className="month-report__columns">
            <StoryList
              title="What held"
              tone="good"
              items={withIds(copy.wentWell, facts.wentWell)}
            />
            <StoryList
              title="What ran hot"
              tone="hot"
              items={withIds(copy.exploded, facts.exploded)}
            />
          </div>

          <MonthReportChart facts={facts} currency={currency} />

          {copy.nextMonth && (
            <p className="month-report__next">{copy.nextMonth}</p>
          )}
          {copy.joke && <p className="month-report__joke">{copy.joke}</p>}
        </>
      )}
    </div>
  );
};

export default MonthReport;
