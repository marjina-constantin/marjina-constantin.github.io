import { monthNames } from '../../utils/constants';
import { extractHashtags } from '../../utils/utils';
import {
  BudgetRing,
  BudgetWindow,
  budgetChoices,
  budgetStatus,
  buildBudgetBaseline,
  buildBudgets,
  countCompleteExpenseMonths,
  monthKeyLabel,
  monthPace,
  summarizeBudgets,
} from '../../budgets/model';
import { ChatChart, ChatChartType } from '../chart';
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
  currency?: string;
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

const monthArg = (value: unknown) => String(value || localToday()).slice(0, 7);

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** Budget rings for a month, built exactly like the Home budgets. */
const budgetFor = (items: AiItem[], args: Args) => {
  const month = monthArg(args.month);
  if (!/^\d{4}-\d{2}$/.test(month)) return { error: 'month must be YYYY-MM' };
  const { options, defaultWindow } = budgetChoices(countCompleteExpenseMonths(items, month));
  if (!options.length) return { error: 'Budgets need at least one completed month of expenses.' };
  const requested = (args.window === 'all' ? 'all' : Number(args.window)) as BudgetWindow;
  const windowSize = options.includes(requested) ? requested : defaultWindow;
  const baseline = buildBudgetBaseline(items, month, windowSize);
  if (!baseline) return { error: 'No budget for this month.' };
  const today = localToday();
  const isCurrent = today.slice(0, 7) === month;
  const cats = Array.isArray(args.categories) ? args.categories.map(String) : null;
  return {
    month,
    windowSize,
    baseline,
    rings: buildBudgets(baseline).filter((ring) => !cats || cats.includes(ring.id)),
    isCurrent,
    pace: isCurrent ? monthPace(today) : 1,
  };
};

const ringKey = (ring: BudgetRing) => `${ring.id}=${ring.label}`;

const budgetOverview = ({ items }: ToolContext, args: Args) => {
  const budget = budgetFor(items, args);
  if ('error' in budget) return budget;
  const { month, windowSize, baseline, rings, isCurrent, pace } = budget;
  const summary = summarizeBudgets(rings);
  return {
    month: monthKeyLabel(month),
    window: windowSize,
    baselineMonths: baseline.months.join(', '),
    ...(isCurrent && { monthPace: round(pace, 3) }),
    spent: summary.spent,
    budget: summary.budget,
    left: round(summary.budget - summary.spent),
    status: budgetStatus(summary.ratio, pace),
    overCategories: summary.over,
    columns: 'category|spent|budget|left|used%|status',
    rows: rings
      .map((r) => `${ringKey(r)}|${r.spent}|${r.budget}|${r.left}|${round(r.ratio * 100, 1)}|${budgetStatus(r.ratio, pace)}`)
      .join('\n'),
    unbudgetedColumns: 'category|spent',
    unbudgeted: baseline.unbudgeted.map((u) => `${u.id}=${u.label}|${u.spent}`).join('\n'),
  };
};

const budgetVsSpend = ({ items }: ToolContext, args: Args) => {
  const budget = budgetFor(items, args);
  if ('error' in budget) return budget;
  const { month, windowSize, rings, isCurrent, pace } = budget;
  const summary = summarizeBudgets(rings);
  const over = rings
    .filter((r) => r.ratio > 1.001)
    .sort((a, b) => b.spent - b.budget - (a.spent - a.budget));
  const left = rings
    .filter((r) => r.left > 0)
    .sort((a, b) => b.left - a.left)
    .slice(0, clampLimit(args.limit, 20, 60));
  const row = (r: BudgetRing) => `${ringKey(r)}|${r.spent}|${r.budget}|${r.left}`;
  const projected = rings
    .map((r) => ({ ring: r, month: round(r.spent / pace) }))
    .filter((p) => p.month > p.ring.budget * 1.001)
    .sort((a, b) => b.month - b.ring.budget - (a.month - a.ring.budget));
  return {
    month: monthKeyLabel(month),
    window: windowSize,
    spent: summary.spent,
    budget: summary.budget,
    overspend: round(over.reduce((sum, r) => sum + r.spent - r.budget, 0)),
    columns: 'category|spent|budget|left',
    over: over.map(row).join('\n'),
    mostLeft: left.map(row).join('\n'),
    ...(isCurrent && {
      monthPace: round(pace, 3),
      projectedSpent: round(summary.spent / pace),
      projectedColumns: 'category|projectedMonth|budget|projectedOver',
      projectedOver: projected
        .map((p) => `${ringKey(p.ring)}|${p.month}|${p.ring.budget}|${round(p.month - p.ring.budget)}`)
        .join('\n'),
    }),
  };
};

const spendSpikes = ({ items, shareDescriptions }: ToolContext, args: Args) => {
  const month = monthArg(args.month);
  if (!/^\d{4}-\d{2}$/.test(month)) return { error: 'month must be YYYY-MM' };
  const lookback = clampLimit(args.lookbackMonths, 12, 36);
  const minRatio = typeof args.minRatio === 'number' && args.minRatio > 1 ? args.minRatio : 1.5;
  const limit = clampLimit(args.limit, 10, 40);
  const from = shiftMonth(month, -lookback);
  const expenses = items.filter((i) => i.kind === 'expense');
  const current = expenses.filter((i) => i.month === month);
  if (!current.length) return { month: monthKeyLabel(month), note: 'No expenses in this month.' };

  const history = expenses.filter((i) => i.month >= from && i.month < month);
  const historyMonths = new Set(history.map((i) => i.month)).size;
  const pastByCat = new Map<string, number[]>();
  for (const i of history) {
    const amounts = pastByCat.get(i.cat) || [];
    amounts.push(i.amount);
    pastByCat.set(i.cat, amounts);
  }
  const nowByCat = new Map<string, number>();
  for (const i of current) nowByCat.set(i.cat, (nowByCat.get(i.cat) || 0) + i.amount);

  const categorySpikes = [...nowByCat.entries()]
    .map(([cat, spent]) => {
      const avg = historyMonths ? (pastByCat.get(cat) || []).reduce((a, b) => a + b, 0) / historyMonths : 0;
      return { cat, spent, avg, ratio: avg > 0 ? spent / avg : 0 };
    })
    .filter((c) => c.avg > 0 && c.ratio >= minRatio && c.spent >= 50)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, limit);

  const expenseSpikes = current
    .map((item) => {
      const past = pastByCat.get(item.cat) || [];
      const typical = past.length >= 5 ? median(past) : 0;
      const max = past.reduce((a, b) => Math.max(a, b), 0);
      return { item, typical, max, ratio: typical > 0 ? item.amount / typical : 0 };
    })
    .filter((e) => e.ratio >= Math.max(minRatio, 2.5) && e.item.amount >= e.max * 0.75)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, limit);

  const monthTotal = sumAmounts(current);
  const avgMonth = historyMonths ? sumAmounts(history) / historyMonths : 0;
  return {
    month: monthKeyLabel(month),
    previousMonths: historyMonths,
    monthTotal,
    avgMonthTotal: round(avgMonth),
    monthVsAvg: avgMonth > 0 ? round(monthTotal / avgMonth, 2) : null,
    categoryColumns: 'category|spent|avgPrevMonths|ratio',
    categorySpikes: categorySpikes
      .map((c) => `${c.cat}=${categoryLabel(c.cat)}|${round(c.spent)}|${round(c.avg)}|${round(c.ratio, 2)}`)
      .join('\n'),
    expenseColumns: 'date|amount|category|description|categoryMedian|ratio',
    expenseSpikes: expenseSpikes
      .map((e) => `${formatLabeledRow(e.item, shareDescriptions)}|${round(e.typical)}|${round(e.ratio, 2)}`)
      .join('\n'),
  };
};

const savingsTrend = ({ items }: ToolContext, args: Args) => {
  const to = monthArg(args.to);
  const from = args.from ? String(args.from).slice(0, 7) : shiftMonth(to, 1 - clampLimit(args.months, 12, 36));
  if (!/^\d{4}-\d{2}$/.test(from) || !/^\d{4}-\d{2}$/.test(to) || from > to) {
    return { error: 'from and to must be YYYY-MM, with from <= to' };
  }

  const totals = new Map<string, { income: number; spent: number }>();
  for (const i of items) {
    if (i.month < from || i.month > to) continue;
    const month = totals.get(i.month) || { income: 0, spent: 0 };
    month[i.kind === 'income' ? 'income' : 'spent'] += i.amount;
    totals.set(i.month, month);
  }
  const rows: { month: string; income: number; spent: number; rate: number | null }[] = [];
  for (let month = from; month <= to && rows.length < 48; month = shiftMonth(month, 1)) {
    const { income, spent } = totals.get(month) || { income: 0, spent: 0 };
    rows.push({ month, income, spent, rate: income > 0 ? ((income - spent) / income) * 100 : null });
  }

  const rated = rows.filter((r): r is typeof r & { rate: number } => r.rate !== null);
  const average = (list: typeof rated) =>
    list.length ? round(list.reduce((sum, r) => sum + r.rate, 0) / list.length, 1) : null;
  const half = Math.floor(rated.length / 2);
  const earlier = average(rated.slice(0, half));
  const later = average(rated.slice(half));
  const delta = earlier !== null && later !== null ? later - earlier : null;
  const byRate = [...rated].sort((a, b) => b.rate - a.rate);
  return {
    from,
    to,
    averageRatePct: average(rated),
    earlierHalfPct: earlier,
    laterHalfPct: later,
    trend: delta === null ? 'n/a' : Math.abs(delta) < 1 ? 'flat' : delta > 0 ? 'improving' : 'worsening',
    bestMonth: byRate.length ? monthKeyLabel(byRate[0].month) : null,
    worstMonth: byRate.length ? monthKeyLabel(byRate[byRate.length - 1].month) : null,
    columns: 'month|income|spent|saved|rate%',
    rows: rows
      .map((r) => `${r.month}|${round(r.income)}|${round(r.spent)}|${round(r.income - r.spent)}|${r.rate === null ? 'n/a' : round(r.rate, 1)}`)
      .join('\n'),
  };
};

const CHART_TYPES: ChatChartType[] = ['column', 'line', 'pie'];
const CHART_GROUPS = ['month', 'year', 'category', 'hashtag', 'weekday'];

const axisLabel = (key: string, groupBy: string) => {
  if (groupBy === 'month' && /^\d{4}-\d{2}$/.test(key)) {
    const [y, m] = key.split('-').map(Number);
    return `${monthNames[m - 1].slice(0, 3)} ${y}`;
  }
  if (groupBy === 'category' && key.includes('=')) return key.split('=')[1] || key;
  return key;
};

const fillKeys = (keys: string[], groupBy: string, from?: string, to?: string, limit = 24) => {
  const fromKey = typeof from === 'string' ? from : '';
  const toKey = typeof to === 'string' ? to : '';
  if (groupBy === 'month') {
    const sorted = keys.filter((k) => /^\d{4}-\d{2}$/.test(k)).sort();
    const start = (/^\d{4}-\d{2}/.test(fromKey) ? fromKey : sorted[0] || '').slice(0, 7);
    const end = (/^\d{4}-\d{2}/.test(toKey) ? toKey : sorted[sorted.length - 1] || '').slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(start) || !/^\d{4}-\d{2}$/.test(end) || start > end) return sorted;
    const out: string[] = [];
    for (let month = start; month <= end && out.length < 48; month = shiftMonth(month, 1)) {
      out.push(month);
    }
    return out.length > limit ? out.slice(-limit) : out;
  }
  if (groupBy === 'year') {
    const sorted = keys.filter((k) => /^\d{4}$/.test(k)).sort();
    const start = parseInt((/^\d{4}/.test(fromKey) ? fromKey : sorted[0] || '').slice(0, 4), 10);
    const end = parseInt((/^\d{4}/.test(toKey) ? toKey : sorted[sorted.length - 1] || '').slice(0, 4), 10);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) return sorted;
    const out: string[] = [];
    for (let year = start; year <= end && out.length < 24; year++) out.push(String(year));
    return out.length > limit ? out.slice(-limit) : out;
  }
  return keys;
};

const chartTitle = (args: Args, chart: string, groupBy: string, splitBy?: string) => {
  const fallback =
    splitBy === 'category'
      ? groupBy === 'month'
        ? 'Monthly totals by category'
        : 'Yearly totals by category'
      : chart === 'pie'
        ? groupBy === 'category'
          ? 'Spending by category'
          : `Spending by ${groupBy}`
        : groupBy === 'month'
          ? 'Monthly totals'
          : groupBy === 'year'
            ? 'Yearly totals'
            : `Totals by ${groupBy}`;
  const title = String(args.title || '')
    .replace(/[\u0000-\u001f<>]/g, '')
    .trim();
  return (title || fallback).slice(0, 80);
};

const chartResponse = (spec: ChatChart, matched: number) => ({
  ok: true,
  chart: spec.type,
  title: spec.title,
  groups: spec.categories.length,
  series: spec.series.map((s) => s.name).join(', '),
  matchedRecords: matched,
  total: round(spec.series.reduce((sum, s) => sum + s.data.reduce((a, b) => a + b, 0), 0)),
  preview: spec.categories
    .map((label, i) => `${label}|${spec.series.map((s) => `${s.name}:${round(s.data[i])}`).join('|')}`)
    .join('\n'),
  _chart: spec,
});

const showChart = ({ items, currency = '' }: ToolContext, args: Args) => {
  const chart = String(args.chart || '') as ChatChartType;
  const groupBy = String(args.groupBy || '');
  const splitBy = args.splitBy ? String(args.splitBy) : '';
  if (!CHART_TYPES.includes(chart)) return { error: 'chart must be column, line or pie' };
  if (!CHART_GROUPS.includes(groupBy)) return { error: 'Unsupported groupBy' };
  if (splitBy && splitBy !== 'category') return { error: 'splitBy must be category' };
  if (splitBy && chart === 'pie') return { error: 'splitBy is not used with pie charts' };
  if (splitBy && groupBy !== 'month' && groupBy !== 'year') {
    return { error: 'splitBy category only works with month or year' };
  }

  const matched = applyFilters(items, args);
  if (!matched.length) return { error: 'No matching records' };

  const maxGroups = chart === 'pie' ? 8 : 24;
  const limit = clampLimit(args.limit, chart === 'pie' ? 8 : 12, maxGroups);
  const title = chartTitle(args, chart, groupBy, splitBy || undefined);
  const seriesName = args.kind === 'income' ? 'Income' : args.kind === 'all' ? 'Total' : 'Expenses';

  if (splitBy === 'category') {
    const rawKeys = [...new Set(matched.flatMap((item) => groupKeys(item, groupBy)))];
    const xKeys = fillKeys(rawKeys, groupBy, args.from, args.to, limit);
    if (xKeys.length < 2) return { error: 'Need at least 2 groups for a chart' };

    const byCat = new Map<string, Map<string, number>>();
    const catTotals = new Map<string, number>();
    for (const item of matched) {
      const xKey = groupKeys(item, groupBy)[0];
      const catKey = groupKeys(item, 'category')[0];
      if (!xKeys.includes(xKey)) continue;
      const catMap = byCat.get(catKey) || new Map<string, number>();
      catMap.set(xKey, (catMap.get(xKey) || 0) + item.amount);
      byCat.set(catKey, catMap);
      catTotals.set(catKey, (catTotals.get(catKey) || 0) + item.amount);
    }

    const ranked = [...catTotals.entries()].sort((a, b) => b[1] - a[1]);
    const top = ranked.slice(0, 6).map(([key]) => key);
    const rest = ranked.slice(6);
    const series = top.map((key) => ({
      name: axisLabel(key, 'category'),
      data: xKeys.map((x) => round(byCat.get(key)?.get(x) || 0)),
    }));
    if (rest.length) {
      const other = new Map<string, number>();
      for (const [key] of rest) {
        const catMap = byCat.get(key);
        if (!catMap) continue;
        for (const [x, value] of catMap) other.set(x, (other.get(x) || 0) + value);
      }
      series.push({ name: 'Other', data: xKeys.map((x) => round(other.get(x) || 0)) });
    }

    return chartResponse(
      {
        type: chart,
        title,
        currency,
        categories: xKeys.map((key) => axisLabel(key, groupBy)),
        series,
      },
      matched.length
    );
  }

  const totals = new Map<string, number>();
  for (const item of matched) {
    for (const key of groupKeys(item, groupBy)) {
      totals.set(key, (totals.get(key) || 0) + item.amount);
    }
  }

  let keys: string[];
  if (groupBy === 'weekday') {
    keys = WEEKDAYS.filter((day) => totals.has(day));
    if (keys.length === WEEKDAYS.length || keys.length >= 3) keys = WEEKDAYS;
  } else if (groupBy === 'month' || groupBy === 'year') {
    keys = fillKeys([...totals.keys()], groupBy, args.from, args.to, limit);
  } else {
    keys = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key);
  }

  if (keys.length < 2) return { error: 'Need at least 2 groups for a chart' };

  const leftover = keys.slice(limit);
  keys = keys.slice(0, limit);
  if (chart === 'pie' && leftover.length) {
    const other = leftover.reduce((sum, key) => sum + (totals.get(key) || 0), 0);
    if (other) {
      keys = [...keys, 'Other'];
      totals.set('Other', other);
    }
  }

  const categories = keys.map((key) => axisLabel(key, groupBy));
  const data = keys.map((key) => round(totals.get(key) || 0));
  return chartResponse(
    { type: chart, title, currency, categories, series: [{ name: seriesName, data }] },
    matched.length
  );
};

const executors: Record<string, (ctx: ToolContext, args: Args) => Record<string, unknown>> = {
  query_transactions: queryTransactions,
  aggregate,
  get_month_summary: monthSummary,
  compare_periods: comparePeriods,
  get_budget_status: budgetOverview,
  compare_budget_vs_spend: budgetVsSpend,
  detect_spend_spikes: spendSpikes,
  get_savings_rate_trend: savingsTrend,
  show_chart: showChart,
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
  get_budget_status: 'Checking budgets',
  compare_budget_vs_spend: 'Comparing budget and spend',
  detect_spend_spikes: 'Looking for spending spikes',
  get_savings_rate_trend: 'Tracking the savings rate',
  show_chart: 'Building a chart',
};
