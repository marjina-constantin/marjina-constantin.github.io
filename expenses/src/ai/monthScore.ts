import { monthNames } from '../utils/constants';
import { AI_STORAGE_KEYS } from './config';
import { AiItem, categoryLabel, localToday, round, sumAmounts } from './data';

export const isMonthKey = (value: string): boolean => /^\d{4}-\d{2}$/.test(value);

export const monthLabelToKey = (label: string): string | null => {
  const match = /^([A-Za-z]+) (\d{4})$/.exec(label);
  if (!match) return null;
  const index = monthNames.indexOf(match[1]);
  if (index < 0) return null;
  return `${match[2]}-${String(index + 1).padStart(2, '0')}`;
};

export const currentMonthKey = () => localToday().slice(0, 7);

export const isClosedMonth = (month: string) => isMonthKey(month) && month < currentMonthKey();

export interface CategoryDelta {
  id: string;
  label: string;
  spent: number;
  avg: number;
  delta: number;
  pct: number | null;
}

export interface MonthScoreFacts {
  month: string;
  label: string;
  spent: number;
  income: number;
  saved: number;
  savingsRate: number | null;
  hasIncome: boolean;
  isOpenMonth: boolean;
  compareMonths: number;
  compareLabel: 'none' | 'last month' | 'last 2 months' | 'last 3 months';
  avgSpentPrev: number | null;
  vsAvg: number | null;
  vsAvgPct: number | null;
  score: number;
  wentWell: CategoryDelta[];
  exploded: CategoryDelta[];
  fingerprint: string;
}

export interface MonthScoreSnapshot {
  month: string;
  fingerprint: string;
  why: string;
  generatedAt: number;
}

const compareLabel = (count: number): MonthScoreFacts['compareLabel'] => {
  if (count >= 3) return 'last 3 months';
  if (count === 2) return 'last 2 months';
  if (count === 1) return 'last month';
  return 'none';
};

const previousExpenseMonths = (items: AiItem[], month: string, count: number) => {
  const months = [...new Set(items.filter((item) => item.kind === 'expense').map((item) => item.month))]
    .filter((key) => key < month)
    .sort()
    .reverse()
    .slice(0, count);
  return months;
};

const averageOfMonths = (items: AiItem[], months: string[]) => {
  const n = months.length || 1;
  const perCat = new Map<string, number>();
  let total = 0;
  for (const item of items) {
    if (item.kind === 'expense' && months.includes(item.month)) {
      total += item.amount;
      perCat.set(item.cat, (perCat.get(item.cat) || 0) + item.amount);
    }
  }
  return {
    total: round(total / n),
    perCat: (cat: string) => round((perCat.get(cat) || 0) / n),
  };
};

const scoreFrom = ({
  hasIncome,
  saved,
  savingsRate,
  vsAvgPct,
  explodedHot,
  useTrend,
}: {
  hasIncome: boolean;
  saved: number;
  savingsRate: number | null;
  vsAvgPct: number | null;
  explodedHot: number;
  useTrend: boolean;
}) => {
  let score = 6;
  if (hasIncome) {
    if (saved > 0) score += 1;
    if (saved < 0) score -= 2;
    if (savingsRate !== null) {
      if (savingsRate >= 20) score += 1;
      if (savingsRate >= 35) score += 1;
      if (savingsRate < 5) score -= 1;
    }
  }
  if (useTrend && vsAvgPct !== null) {
    if (vsAvgPct <= -8) score += 1;
    if (vsAvgPct >= 10) score -= 1;
    if (vsAvgPct >= 25) score -= 1;
    score -= Math.min(2, explodedHot);
  }
  return Math.max(1, Math.min(10, score));
};

export const buildMonthScoreFacts = (
  items: AiItem[],
  month: string
): MonthScoreFacts | null => {
  if (!isMonthKey(month)) return null;
  const inMonth = items.filter((item) => item.month === month);
  const expenses = inMonth.filter((item) => item.kind === 'expense');
  if (!expenses.length) return null;

  const spent = sumAmounts(expenses);
  const income = sumAmounts(inMonth.filter((item) => item.kind === 'income'));
  const saved = round(income - spent);
  const hasIncome = income > 0;
  const open = !isClosedMonth(month);
  const prevMonths = previousExpenseMonths(items, month, 3);
  const useTrend = !open && prevMonths.length > 0;
  const avg = useTrend ? averageOfMonths(items, prevMonths) : null;
  const vsAvg = avg ? round(spent - avg.total) : null;
  const vsAvgPct =
    avg && vsAvg !== null && avg.total > 0 ? round((vsAvg / avg.total) * 100, 1) : null;
  const savingsRate = hasIncome ? round((saved / income) * 100, 1) : null;

  const byCat = new Map<string, number>();
  for (const expense of expenses) {
    byCat.set(expense.cat, (byCat.get(expense.cat) || 0) + expense.amount);
  }

  const categories: CategoryDelta[] = [...byCat.entries()]
    .map(([id, total]) => {
      const average = avg ? avg.perCat(id) : 0;
      const delta = round(total - average);
      return {
        id,
        label: categoryLabel(id) || 'Uncategorized',
        spent: round(total),
        avg: average,
        delta,
        pct: average > 0 ? round((delta / average) * 100, 1) : null,
      };
    })
    .sort((a, b) => b.spent - a.spent);

  const wentWell = useTrend
    ? [...categories]
        .filter((c) => c.delta < 0 && c.label !== 'Uncategorized')
        .sort((a, b) => a.delta - b.delta)
        .slice(0, 3)
    : [];
  const exploded = useTrend
    ? [...categories]
        .filter((c) => c.delta > 0 && c.label !== 'Uncategorized')
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 3)
    : [];
  const explodedHot = exploded.filter((c) => (c.pct || 0) >= 40).length;
  const [year, monthNum] = month.split('-').map(Number);
  const score = scoreFrom({
    hasIncome,
    saved,
    savingsRate,
    vsAvgPct,
    explodedHot,
    useTrend,
  });

  return {
    month,
    label: `${monthNames[monthNum - 1]} ${year}`,
    spent,
    income,
    saved,
    savingsRate,
    hasIncome,
    isOpenMonth: open,
    compareMonths: useTrend ? prevMonths.length : 0,
    compareLabel: useTrend ? compareLabel(prevMonths.length) : 'none',
    avgSpentPrev: avg ? avg.total : null,
    vsAvg,
    vsAvgPct,
    score,
    wentWell,
    exploded,
    fingerprint: [
      month,
      spent,
      income,
      expenses.length,
      open ? 'open' : 'closed',
      prevMonths.join(','),
      score,
      ...categories.map((c) => `${c.id}:${c.spent}`),
    ].join('|'),
  };
};

const readStore = (): Record<string, MonthScoreSnapshot> => {
  try {
    const parsed = JSON.parse(localStorage.getItem(AI_STORAGE_KEYS.monthScores) || 'null');
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, MonthScoreSnapshot>;
  } catch {
    return {};
  }
};

export const getMonthScoreSnapshot = (month: string): MonthScoreSnapshot | null =>
  readStore()[month] || null;

export const saveMonthScoreSnapshot = (snapshot: MonthScoreSnapshot) => {
  const store = readStore();
  store[snapshot.month] = snapshot;
  localStorage.setItem(AI_STORAGE_KEYS.monthScores, JSON.stringify(store));
};

export const factsPacketForModel = (facts: MonthScoreFacts, currency: string) =>
  JSON.stringify(
    {
      month: facts.label,
      currency,
      score: facts.score,
      isOpenMonth: facts.isOpenMonth,
      comparedTo: facts.compareLabel,
      spent: facts.spent,
      income: facts.hasIncome ? facts.income : null,
      saved: facts.hasIncome ? facts.saved : null,
      savingsRatePct: facts.savingsRate,
      vsAveragePct: facts.vsAvgPct,
      vsAverage: facts.vsAvg,
      avgSpentPrevious: facts.avgSpentPrev,
      wentWell: facts.wentWell.map((c) => ({
        label: c.label,
        delta: c.delta,
        pct: c.pct,
      })),
      exploded: facts.exploded.map((c) => ({
        label: c.label,
        delta: c.delta,
        pct: c.pct,
      })),
    },
    null,
    2
  );
