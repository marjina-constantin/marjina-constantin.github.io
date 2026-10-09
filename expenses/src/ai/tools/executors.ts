import { monthNames } from '../../utils/constants';
import { extractHashtags } from '../../utils/utils';
import { AI_LIMITS } from '../config';
import {
  AiItem,
  categoryLabel,
  localToday,
  normalizeText,
  round,
  sumAmounts,
  visibleDescription,
} from '../data';

export interface ToolContext {
  items: AiItem[];
  shareDescriptions: boolean;
}

type Args = Record<string, any>;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const clampLimit = (value: unknown, fallback: number, max: number) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : fallback;
};

const startOf = (value?: string) => (value && value.length === 7 ? `${value}-01` : value);
const endOf = (value?: string) => (value && value.length === 7 ? `${value}-31` : value);

const applyFilters = (items: AiItem[], args: Args): AiItem[] => {
  const kind = args.kind || 'expense';
  const from = startOf(args.from);
  const to = endOf(args.to);
  const cats = Array.isArray(args.categories) ? args.categories.map(String) : null;
  const text = args.text ? normalizeText(String(args.text)) : '';
  const min = typeof args.minAmount === 'number' ? args.minAmount : null;
  const max = typeof args.maxAmount === 'number' ? args.maxAmount : null;

  return items.filter(
    (i) =>
      (kind === 'all' || i.kind === kind) &&
      (!from || i.date >= from) &&
      (!to || i.date <= to) &&
      (!cats || cats.includes(i.cat)) &&
      (!text || i.search.includes(text)) &&
      (min === null || i.amount >= min) &&
      (max === null || i.amount <= max)
  );
};

const formatRow = (i: AiItem, share: boolean) =>
  [i.date, round(i.amount), i.kind === 'income' ? 'income' : i.cat, visibleDescription(i.desc, share)]
    .join('|');

const formatLabeledRow = (i: AiItem, share: boolean) =>
  [i.date, round(i.amount), i.kind === 'income' ? 'income' : categoryLabel(i.cat), visibleDescription(i.desc, share)]
    .join('|');

const queryTransactions = ({ items, shareDescriptions }: ToolContext, args: Args) => {
  const matched = applyFilters(items, args);
  const limit = clampLimit(args.limit, AI_LIMITS.toolRowsDefault, AI_LIMITS.toolRowsMax);
  const sorted = [...matched];
  switch (args.sort) {
    case 'date_asc':
      sorted.reverse();
      break;
    case 'amount_desc':
      sorted.sort((a, b) => b.amount - a.amount);
      break;
    case 'amount_asc':
      sorted.sort((a, b) => a.amount - b.amount);
      break;
  }
  const rows = sorted.slice(0, limit);
  return {
    matched: matched.length,
    total: sumAmounts(matched),
    shown: rows.length,
    truncated: matched.length > rows.length,
    columns: 'date|amount|category id or income|description',
    rows: rows.map((i) => formatRow(i, shareDescriptions)).join('\n'),
  };
};

const groupKeys = (item: AiItem, groupBy: string): string[] => {
  switch (groupBy) {
    case 'year':
      return [item.date.slice(0, 4)];
    case 'category':
      return [item.kind === 'income' ? 'income' : `${item.cat}=${categoryLabel(item.cat)}`];
    case 'description':
      return [item.search.replace(/\s*#.*$/, '').trim() || item.search || '(empty)'];
    case 'hashtag': {
      const tags = extractHashtags(item.desc).map((t) => `#${normalizeText(t)}`);
      return tags.length ? tags : ['(no tag)'];
    }
    case 'weekday':
      return [WEEKDAYS[new Date(`${item.date}T12:00:00`).getDay()]];
    default:
      return [item.month];
  }
};

const aggregate = ({ items, shareDescriptions }: ToolContext, args: Args) => {
  const groupBy = String(args.groupBy || 'month');
  if (groupBy === 'description' && !shareDescriptions) {
    return { error: 'The user disabled sharing descriptions. Use hashtag or category instead.' };
  }
  const matched = applyFilters(items, args);
  const groups = new Map<string, { total: number; count: number }>();
  for (const item of matched) {
    for (const key of groupKeys(item, groupBy)) {
      const group = groups.get(key) || { total: 0, count: 0 };
      group.total += item.amount;
      group.count++;
      groups.set(key, group);
    }
  }

  const entries = [...groups.entries()];
  switch (args.sort) {
    case 'count_desc':
      entries.sort((a, b) => b[1].count - a[1].count);
      break;
    case 'key_asc':
      entries.sort((a, b) => a[0].localeCompare(b[0]));
      break;
    case 'key_desc':
      entries.sort((a, b) => b[0].localeCompare(a[0]));
      break;
    default:
      entries.sort((a, b) => b[1].total - a[1].total);
  }
  const limit = clampLimit(args.limit, AI_LIMITS.toolGroupsDefault, AI_LIMITS.toolGroupsMax);

  return {
    matchedRecords: matched.length,
    total: sumAmounts(matched),
    groupCount: entries.length,
    truncated: entries.length > limit,
    columns: `${groupBy}|total|count|average`,
    rows: entries
      .slice(0, limit)
      .map(([key, g]) => `${key}|${round(g.total)}|${g.count}|${round(g.total / g.count)}`)
      .join('\n'),
  };
};

const shiftMonth = (month: string, delta: number) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthSummary = ({ items, shareDescriptions }: ToolContext, args: Args) => {
  const month = String(args.month || localToday().slice(0, 7)).slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) return { error: 'month must be YYYY-MM' };

  const firstMonth = items.length ? items[items.length - 1].month : month;
  const inMonth = items.filter((i) => i.month === month);
  const expenses = inMonth.filter((i) => i.kind === 'expense');
  const spent = sumAmounts(expenses);
  const income = sumAmounts(inMonth.filter((i) => i.kind === 'income'));

  const averageOfPrevious = (count: number) => {
    const months: string[] = [];
    for (let i = 1; i <= count; i++) {
      const m = shiftMonth(month, -i);
      if (m >= firstMonth) months.push(m);
    }
    const perCat = new Map<string, number>();
    let total = 0;
    for (const i of items) {
      if (i.kind === 'expense' && months.includes(i.month)) {
        total += i.amount;
        perCat.set(i.cat, (perCat.get(i.cat) || 0) + i.amount);
      }
    }
    const n = months.length || 1;
    return { total: round(total / n), perCat: (cat: string) => round((perCat.get(cat) || 0) / n) };
  };
  const avg3 = averageOfPrevious(3);
  const avg12 = averageOfPrevious(12);

  const byCat = new Map<string, number>();
  for (const e of expenses) byCat.set(e.cat, (byCat.get(e.cat) || 0) + e.amount);

  const [y, m] = month.split('-').map(Number);
  const today = localToday();
  const daysInMonth = new Date(y, m, 0).getDate();
  const isCurrent = today.slice(0, 7) === month;
  const daysElapsed = isCurrent ? parseInt(today.slice(8, 10)) : daysInMonth;

  return {
    month: `${monthNames[m - 1]} ${y}`,
    spent,
    income,
    saved: round(income - spent),
    expenseCount: expenses.length,
    avgSpentPrev3Months: avg3.total,
    avgSpentPrev12Months: avg12.total,
    ...(isCurrent && {
      daysElapsed,
      daysInMonth,
      linearProjection: round((spent / Math.max(daysElapsed, 1)) * daysInMonth),
    }),
    categoriesColumns: 'category|spent|avgPrev3|avgPrev12',
    categories: [...byCat.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([cat, total]) => `${cat}=${categoryLabel(cat)}|${round(total)}|${avg3.perCat(cat)}|${avg12.perCat(cat)}`)
      .join('\n'),
    biggestExpensesColumns: 'date|amount|category|description',
    biggestExpenses: [...expenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((i) => formatLabeledRow(i, shareDescriptions))
      .join('\n'),
  };
};

const comparePeriods = ({ items }: ToolContext, args: Args) => {
  const kind = args.kind === 'income' ? 'income' : 'expense';
  const a = applyFilters(items, { kind, from: args.aFrom, to: args.aTo });
  const b = applyFilters(items, { kind, from: args.bFrom, to: args.bTo });
  const keyOf = (i: AiItem) => (kind === 'income' ? 'income' : `${i.cat}=${categoryLabel(i.cat)}`);
  const totals = new Map<string, { a: number; b: number }>();
  const add = (item: AiItem, period: 'a' | 'b') => {
    const entry = totals.get(keyOf(item)) || { a: 0, b: 0 };
    entry[period] += item.amount;
    totals.set(keyOf(item), entry);
  };
  a.forEach((item) => add(item, 'a'));
  b.forEach((item) => add(item, 'b'));

  const pct = (from: number, to: number) => (from ? `${round(((to - from) / from) * 100, 1)}%` : 'n/a');
  const totalA = sumAmounts(a);
  const totalB = sumAmounts(b);
  return {
    periodA: `${args.aFrom}..${args.aTo}`,
    periodB: `${args.bFrom}..${args.bTo}`,
    totalA,
    totalB,
    change: round(totalB - totalA),
    changePct: pct(totalA, totalB),
    columns: 'category|A|B|B-A|change%',
    rows: [...totals.entries()]
      .sort((x, y) => Math.abs(y[1].b - y[1].a) - Math.abs(x[1].b - x[1].a))
      .map(([key, v]) => `${key}|${round(v.a)}|${round(v.b)}|${round(v.b - v.a)}|${pct(v.a, v.b)}`)
      .join('\n'),
  };
};

const executors: Record<string, (ctx: ToolContext, args: Args) => Record<string, unknown>> = {
  query_transactions: queryTransactions,
  aggregate,
  get_month_summary: monthSummary,
  compare_periods: comparePeriods,
};

export const executeTool = (name: string, args: Args | undefined, ctx: ToolContext) => {
  const executor = executors[name];
  if (!executor) return { error: `Unknown tool ${name}` };
  try {
    return executor(ctx, args || {});
  } catch (error) {
    return { error: (error as Error).message };
  }
};

export const TOOL_LABELS: Record<string, string> = {
  query_transactions: 'Looking up transactions',
  aggregate: 'Calculating totals',
  get_month_summary: 'Summarizing the month',
  compare_periods: 'Comparing periods',
};
