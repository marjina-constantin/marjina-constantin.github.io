import { monthNames } from '../utils/constants';
import { categoryLabel } from './data';

type Args = Record<string, any>;

const money = (value: unknown, currency?: string) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value ?? '—');
  const formatted = amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return currency ? `${formatted} ${currency}` : formatted;
};

const count = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString() : String(value ?? '0');
};

const lines = (value: unknown) =>
  typeof value === 'string' ? value.split('\n').filter((line) => line.trim()).length : 0;

const labelPeriod = (value: string) => {
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-').map(Number);
    return `${monthNames[month - 1]} ${year}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return `${day} ${monthNames[month - 1].slice(0, 3)} ${year}`;
  }
  return value;
};

const rangeLabel = (from?: unknown, to?: unknown) => {
  const start = typeof from === 'string' ? from : '';
  const end = typeof to === 'string' ? to : '';
  if (start && end && start === end) return labelPeriod(start);
  if (start && end) return `${labelPeriod(start)} – ${labelPeriod(end)}`;
  if (start) return `from ${labelPeriod(start)}`;
  if (end) return `up to ${labelPeriod(end)}`;
  return '';
};

const kindWord = (kind?: unknown) => {
  if (kind === 'income') return 'income';
  if (kind === 'all') return 'expense and income';
  return 'expense';
};

const categoryList = (value: unknown) => {
  if (!Array.isArray(value) || !value.length) return '';
  const names = value.map((id) => categoryLabel(String(id)) || String(id));
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
};

const groupLabel = (groupBy: unknown) => {
  switch (String(groupBy || 'month')) {
    case 'year':
      return 'year';
    case 'category':
      return 'category';
    case 'description':
      return 'description';
    case 'hashtag':
      return 'hashtag';
    case 'weekday':
      return 'weekday';
    default:
      return 'month';
  }
};

const sortLabel = (sort: unknown) => {
  switch (sort) {
    case 'date_asc':
      return 'oldest first';
    case 'amount_desc':
    case 'total_desc':
      return 'largest first';
    case 'amount_asc':
      return 'smallest first';
    case 'count_desc':
      return 'most frequent first';
    case 'key_asc':
      return 'A–Z';
    case 'key_desc':
      return 'Z–A';
    default:
      return '';
  }
};

const windowLabel = (windowSize: unknown) => {
  if (windowSize === 'all') return 'all completed months';
  const n = Number(windowSize);
  if (n === 1) return 'the last completed month';
  if (n > 0) return `the last ${n} completed months`;
  return '';
};

const rowLabel = (row: string) => {
  const key = row.split('|')[0] || row;
  return key.includes('=') ? key.slice(key.indexOf('=') + 1) : key;
};

const filterScope = (args: Args = {}) => {
  const parts: string[] = [`${kindWord(args.kind)} records`];
  const period = rangeLabel(args.from, args.to);
  if (period) parts.push(period.startsWith('from') || period.startsWith('up') ? period : `in ${period}`);
  const cats = categoryList(args.categories);
  if (cats) parts.push(`in ${cats}`);
  if (typeof args.text === 'string' && args.text.trim()) parts.push(`matching “${args.text.trim()}”`);
  if (typeof args.minAmount === 'number' && typeof args.maxAmount === 'number') {
    parts.push(`between ${args.minAmount} and ${args.maxAmount}`);
  } else if (typeof args.minAmount === 'number') {
    parts.push(`of at least ${args.minAmount}`);
  } else if (typeof args.maxAmount === 'number') {
    parts.push(`up to ${args.maxAmount}`);
  }
  return parts.join(' ');
};

const joinSentences = (...parts: (string | false | undefined)[]) =>
  parts
    .filter((part): part is string => !!part)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

export const summarizeToolCall = (
  name: string,
  args: Args | undefined,
  result: Record<string, unknown>,
  currency?: string
): string => {
  if (typeof result.error === 'string') {
    return `Could not run this tool: ${result.error}`;
  }

  const input = args || {};

  switch (name) {
    case 'query_transactions': {
      const matched = Number(result.matched) || 0;
      const shown = Number(result.shown) || 0;
      const sort = sortLabel(input.sort);
      return joinSentences(
        `Looked up ${filterScope(input)}${sort ? `, ${sort}` : ''}.`,
        result.truncated
          ? `Found ${count(matched)} matching items totaling ${money(result.total, currency)}; returned the first ${count(shown)}.`
          : `Found ${count(matched)} matching items totaling ${money(result.total, currency)}.`
      );
    }
    case 'aggregate': {
      const groups = Number(result.groupCount) || 0;
      const shown = lines(result.rows);
      const first = typeof result.rows === 'string' ? result.rows.split('\n')[0] : '';
      const [topKey, topTotal, topCount] = first ? first.split('|') : [];
      const top = topKey
        ? ` Top group: ${rowLabel(topKey)} at ${money(topTotal, currency)} (${count(topCount)} items).`
        : '';
      return joinSentences(
        `Grouped ${filterScope(input)} by ${groupLabel(input.groupBy)}.`,
        `${count(result.matchedRecords)} records totaling ${money(result.total, currency)} across ${count(groups)} groups${
          result.truncated ? ` (showing ${count(shown)})` : ''
        }.${top}`
      );
    }
    case 'get_month_summary': {
      const month = String(result.month || input.month || 'the month');
      const vs3 = Number(result.spent) - Number(result.avgSpentPrev3Months);
      const vs3text = Number.isFinite(vs3)
        ? vs3 > 0
          ? `above the previous 3-month average (${money(result.avgSpentPrev3Months, currency)})`
          : vs3 < 0
            ? `below the previous 3-month average (${money(result.avgSpentPrev3Months, currency)})`
            : `in line with the previous 3-month average`
        : '';
      const projection =
        result.linearProjection !== undefined
          ? ` On day ${result.daysElapsed} of ${result.daysInMonth}, a linear projection lands at ${money(
              result.linearProjection,
              currency
            )}.`
          : '';
      return joinSentences(
        `Summarized ${month}: spent ${money(result.spent, currency)}, income ${money(result.income, currency)}, saved ${money(
          result.saved,
          currency
        )} from ${count(result.expenseCount)} expenses.`,
        vs3text ? `Spending is ${vs3text}.` : '',
        projection
      );
    }
    case 'compare_periods': {
      const kind = kindWord(input.kind);
      const a = rangeLabel(input.aFrom, input.aTo) || String(result.periodA || 'period A');
      const b = rangeLabel(input.bFrom, input.bTo) || String(result.periodB || 'period B');
      const change = Number(result.change);
      const direction = !Number.isFinite(change)
        ? ''
        : change > 0
          ? `up ${money(change, currency)} (${result.changePct})`
          : change < 0
            ? `down ${money(Math.abs(change), currency)} (${result.changePct})`
            : 'unchanged';
      return joinSentences(
        `Compared ${kind} totals in ${a} vs ${b}.`,
        `Period A ${money(result.totalA, currency)}, period B ${money(result.totalB, currency)}${
          direction ? `, ${direction}` : ''
        }.`
      );
    }
    case 'get_budget_status': {
      const over = Number(result.overCategories) || 0;
      const status =
        result.status === 'over'
          ? 'over budget'
          : result.status === 'ahead'
            ? 'spending faster than this month’s pace'
            : result.status === 'ok'
              ? 'on track'
              : String(result.status || '');
      return joinSentences(
        `Checked ${result.month || 'this month'}’s budgets against ${windowLabel(result.window) || 'the usual baseline'}.`,
        `Spent ${money(result.spent, currency)} of ${money(result.budget, currency)} (${money(result.left, currency)} left).`,
        status ? `Overall: ${status}.` : '',
        over ? `${over} categor${over === 1 ? 'y is' : 'ies are'} over budget.` : 'No category is over budget.'
      );
    }
    case 'detect_spend_spikes': {
      if (result.note) return String(result.note);
      const cats = lines(result.categorySpikes);
      const items = lines(result.expenseSpikes);
      const vs =
        result.monthVsAvg !== null && result.monthVsAvg !== undefined
          ? ` (${result.monthVsAvg}× the average)`
          : '';
      return joinSentences(
        `Looked for spending spikes in ${result.month || 'this month'} versus the previous ${count(
          result.previousMonths
        )} months.`,
        `Month total ${money(result.monthTotal, currency)} vs ${money(result.avgMonthTotal, currency)} average${vs}.`,
        cats || items
          ? `Found ${count(cats)} category spike${cats === 1 ? '' : 's'} and ${count(items)} unusually large expense${
              items === 1 ? '' : 's'
            }.`
          : 'No spikes crossed the threshold.'
      );
    }
    case 'get_savings_rate_trend': {
      const trend =
        result.trend === 'improving'
          ? 'improving'
          : result.trend === 'worsening'
            ? 'worsening'
            : result.trend === 'flat'
              ? 'flat'
              : '';
      const halves =
        result.earlierHalfPct !== null && result.laterHalfPct !== null
          ? ` First half averaged ${result.earlierHalfPct}%, second half ${result.laterHalfPct}%.`
          : '';
      const from = typeof result.from === 'string' ? result.from : String(input.from || '');
      const to = typeof result.to === 'string' ? result.to : String(input.to || '');
      const span = from && to ? ` from ${labelPeriod(from)} to ${labelPeriod(to)}` : '';
      return joinSentences(
        `Tracked the monthly savings rate${span}.`,
        result.averageRatePct !== null && result.averageRatePct !== undefined
          ? `Average ${result.averageRatePct}%${trend ? `, ${trend}` : ''}.`
          : '',
        halves,
        result.bestMonth && result.worstMonth
          ? `Best month ${result.bestMonth}, worst ${result.worstMonth}.`
          : ''
      );
    }
    case 'show_chart': {
      const split = input.splitBy === 'category' ? ', split by category' : '';
      return joinSentences(
        `Drew a ${result.chart || input.chart} chart of ${kindWord(input.kind)} totals by ${groupLabel(
          input.groupBy
        )}${split}.`,
        `${count(result.groups)} groups from ${count(result.matchedRecords)} records, totaling ${money(
          result.total,
          currency
        )}.`,
        result.title ? `Title: “${result.title}”.` : ''
      );
    }
    default:
      return `Ran ${name.replace(/_/g, ' ')}.`;
  }
};
