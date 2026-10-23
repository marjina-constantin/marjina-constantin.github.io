import { AiItem, categoryLabel, round } from '../ai/data';
import { monthNames } from '../utils/constants';

export type BudgetWindow = 1 | 3 | 6 | 12 | 'all';

export const monthKeyLabel = (key: string) => {
  const [year, month] = key.split('-').map(Number);
  if (!year || !month || month < 1 || month > 12) return key;
  return `${monthNames[month - 1]} ${year}`;
};

const labelOrder = (label: string) => {
  const match = /^([A-Za-z]+) (\d{4})$/.exec(label);
  if (!match) return null;
  const index = monthNames.indexOf(match[1]);
  return index < 0 ? null : Number(match[2]) * 12 + index;
};

/**
 * Month page that hosts the budgets: the current month when it has entries,
 * otherwise the newest month that is not in the future.
 */
export const budgetHostMonth = (labels: string[], today: Date) => {
  const todayOrder = today.getFullYear() * 12 + today.getMonth();
  let best: { label: string; order: number } | null = null;
  for (const label of labels) {
    const order = labelOrder(label);
    if (order === null || order > todayOrder) continue;
    if (!best || order > best.order) best = { label, order };
  }
  return best?.label;
};

/** Share of the current month that has elapsed, counting today as spent. */
export const monthPace = (today: string) => {
  const [year, month, day] = today.split('-').map(Number);
  return Math.min(1, day / new Date(year, month, 0).getDate());
};

export type BudgetStatus = 'ok' | 'ahead' | 'over';

export const budgetStatus = (ratio: number, pace: number): BudgetStatus => {
  if (ratio > 1.001) return 'over';
  if (ratio > pace + 0.15) return 'ahead';
  return 'ok';
};

export const budgetChoices = (
  completeMonths: number
): { options: BudgetWindow[]; defaultWindow: BudgetWindow } => {
  if (completeMonths >= 12) return { options: [3, 6, 12, 'all'], defaultWindow: 12 };
  if (completeMonths >= 6) return { options: [3, 6, 'all'], defaultWindow: 6 };
  if (completeMonths >= 3) return { options: [3, 'all'], defaultWindow: 3 };
  if (completeMonths >= 1) return { options: [1, 'all'], defaultWindow: 1 };
  return { options: [], defaultWindow: 1 };
};

export const windowLabel = (value: BudgetWindow) =>
  value === 'all' ? 'All' : `${value}`;

/** First day of the month after `today` (YYYY-MM-DD), e.g. "November 1, 2026". */
export const budgetUnlockLabel = (today: string) => {
  const [year, month] = today.split('-').map(Number);
  const next = new Date(year, month, 1);
  return `${monthNames[next.getMonth()]} 1, ${next.getFullYear()}`;
};

export interface BudgetCategory {
  id: string;
  label: string;
  average: number;
}

export interface BudgetBaseline {
  months: string[];
  categories: BudgetCategory[];
  spentByCategory: Record<string, number>;
  /** Categories spent on this month that have no average to compare against. */
  unbudgeted: { id: string; label: string; spent: number }[];
}

export interface BudgetRing {
  id: string;
  label: string;
  spent: number;
  budget: number;
  ratio: number;
  left: number;
}

export interface BudgetSummary {
  spent: number;
  budget: number;
  ratio: number;
  over: number;
}

const labelFor = (id: string) =>
  id === '0' ? 'Uncategorized' : categoryLabel(id) || 'Category';

const monthKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, '0')}`;

/** Completed months that contain expenses, oldest first. The current month is excluded. */
const expenseMonthsBefore = (items: AiItem[], today: string) => {
  const current = today.slice(0, 7);
  return [
    ...new Set(
      items
        .filter((item) => item.kind === 'expense' && item.month < current)
        .map((item) => item.month)
    ),
  ].sort();
};

export const countCompleteExpenseMonths = (items: AiItem[], today: string) =>
  expenseMonthsBefore(items, today).length;

export const buildBudgetBaseline = (
  items: AiItem[],
  today: string,
  windowSize: BudgetWindow
): BudgetBaseline | null => {
  const history = expenseMonthsBefore(items, today);
  const months = windowSize === 'all' ? history : history.slice(-windowSize);
  if (!months.length) return null;
  const monthSet = new Set(months);
  const [year, month] = today.split('-').map(Number);
  const currentMonth = monthKey(year, month);
  const totals = new Map<string, number>();
  const spentByCategory: Record<string, number> = {};

  for (const item of items) {
    if (item.kind !== 'expense') continue;
    const id = item.cat || '0';
    if (item.month === currentMonth) {
      spentByCategory[id] = (spentByCategory[id] || 0) + item.amount;
    }
    if (monthSet.has(item.month)) {
      totals.set(id, (totals.get(id) || 0) + item.amount);
    }
  }

  const categories = [...totals.entries()]
    .map(([id, total]) => ({
      id,
      label: labelFor(id),
      average: round(total / months.length),
    }))
    .filter((category) => category.average > 1)
    .sort((a, b) => b.average - a.average || a.label.localeCompare(b.label));

  if (!categories.length) return null;

  const budgeted = new Set(categories.map((category) => category.id));
  const unbudgeted = Object.entries(spentByCategory)
    .filter(([id, spent]) => !budgeted.has(id) && spent > 0)
    .map(([id, spent]) => ({ id, label: labelFor(id), spent: round(spent) }))
    .sort((a, b) => b.spent - a.spent);

  return {
    months,
    categories,
    spentByCategory: Object.fromEntries(
      Object.entries(spentByCategory).map(([id, value]) => [id, round(value)])
    ),
    unbudgeted,
  };
};

export const buildBudgets = (baseline: BudgetBaseline): BudgetRing[] =>
  baseline.categories
    .map((category) => {
      const spent = baseline.spentByCategory[category.id] || 0;
      return {
        id: category.id,
        label: category.label,
        spent,
        budget: category.average,
        ratio: spent / category.average,
        left: round(category.average - spent),
      };
    })
    .sort((a, b) => b.ratio - a.ratio || b.spent - a.spent);

export const summarizeBudgets = (rings: BudgetRing[]): BudgetSummary => {
  const spent = round(rings.reduce((sum, ring) => sum + ring.spent, 0));
  const budget = round(rings.reduce((sum, ring) => sum + ring.budget, 0));
  return {
    spent,
    budget,
    ratio: budget > 0 ? spent / budget : 0,
    over: rings.filter((ring) => ring.ratio > 1.001).length,
  };
};
