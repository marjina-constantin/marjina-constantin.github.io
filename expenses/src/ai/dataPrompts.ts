import { extractHashtags } from '../utils/utils';
import { AiItem, categoryLabel, localToday } from './data';

export interface DataPrompt {
  text: string;
  /** Higher = more unusual / more relevant right now. */
  priority: number;
}

const shiftMonth = (month: string, delta: number) => {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1 + delta, 1)).toISOString().slice(0, 7);
};

const shiftDay = (date: string, delta: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
};

const monthName = (month: string) =>
  new Date(`${month}-15T12:00:00`).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });

const calendarMonthName = (month: string) => {
  const name = new Date(`${month}-15T12:00:00`).toLocaleDateString('ro-RO', { month: 'long' });
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const dayLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' });

const fmt = (value: number) => Math.round(value).toLocaleString('ro-RO');

const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const sum = (items: AiItem[]) => items.reduce((total, i) => total + i.amount, 0);

const sumBy = (items: AiItem[], key: (item: AiItem) => string | string[]) => {
  const totals = new Map<string, number>();
  for (const item of items) {
    const keys = key(item);
    for (const k of Array.isArray(keys) ? keys : [keys]) {
      if (k) totals.set(k, (totals.get(k) || 0) + item.amount);
    }
  }
  return totals;
};

const groupBy = <T,>(items: T[], key: (item: T) => string) => {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    if (!k) continue;
    const list = groups.get(k);
    if (list) list.push(item);
    else groups.set(k, [item]);
  }
  return groups;
};

const topEntry = (totals: Map<string, number>) =>
  [...totals.entries()].sort((a, b) => b[1] - a[1])[0];

const tagsOf = (item: AiItem) => extractHashtags(item.desc).map((t) => t.toLowerCase());

/**
 * Personal, context-aware questions computed locally (no AI request).
 * Each one is only produced when the data actually shows the pattern.
 */
export const buildDataPrompts = (items: AiItem[], shareDescriptions: boolean): DataPrompt[] => {
  const expenses = items.filter((i) => i.kind === 'expense');
  const incomes = items.filter((i) => i.kind === 'income');
  if (expenses.length < 20) return [];

  const prompts: DataPrompt[] = [];
  const add = (priority: number, text: string) => prompts.push({ priority, text });

  const today = localToday();
  const thisMonth = today.slice(0, 7);
  const lastMonth = shiftMonth(thisMonth, -1);
  const day = Number(today.slice(8));
  const [year, monthNumber] = thisMonth.split('-').map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const thisMonthName = calendarMonthName(thisMonth).toLowerCase();

  const inMonths = (list: AiItem[], from: string, to: string) =>
    list.filter((i) => i.month >= from && i.month <= to);
  const current = inMonths(expenses, thisMonth, thisMonth);
  const past12 = inMonths(expenses, shiftMonth(thisMonth, -12), lastMonth);
  const monthTotals = [...sumBy(past12, (i) => i.month).values()];
  const avgMonth = monthTotals.length ? monthTotals.reduce((a, b) => a + b, 0) / monthTotals.length : 0;
  const spent = sum(current);

  // --- This month ---------------------------------------------------------

  // A single expense far above what is normal for its category.
  const pastByCat = groupBy(past12, (i) => i.cat);
  const outlier = current
    .map((item) => {
      const history = (pastByCat.get(item.cat) || []).map((i) => i.amount);
      const typical = median(history);
      return { item, ratio: history.length >= 5 && typical > 0 ? item.amount / typical : 0, max: Math.max(0, ...history) };
    })
    .filter((o) => o.ratio >= 3 && o.item.amount >= o.max * 0.8 && categoryLabel(o.item.cat))
    .sort((a, b) => b.ratio - a.ratio)[0];
  if (outlier) {
    add(
      4,
      `Cheltuiala de ${fmt(outlier.item.amount)} la ${categoryLabel(outlier.item.cat)} din ${dayLabel(outlier.item.date)} e mult peste obișnuit. Cum îmi afectează luna?`
    );
  }

  // A category already well above its usual level (unless one outlier explains it).
  const currentByCat = sumBy(current, (i) => i.cat);
  const prev3ByCat = sumBy(inMonths(expenses, shiftMonth(thisMonth, -3), lastMonth), (i) => i.cat);
  const rising = [...currentByCat.entries()]
    .map(([cat, total]) => ({ cat, total, average: (prev3ByCat.get(cat) || 0) / 3 }))
    .filter((c) => c.average > 0 && c.total > c.average * 1.2 && categoryLabel(c.cat))
    .sort((a, b) => b.total / b.average - a.total / a.average)[0];
  if (rising && rising.cat !== outlier?.item.cat) {
    const pct = Math.round((rising.total / rising.average - 1) * 100);
    add(3, `De ce cheltuielile pe ${categoryLabel(rising.cat)} sunt cu ${pct}% peste medie luna aceasta?`);
  }

  // Month on track to be a record (high or low).
  if (day >= 7 && monthTotals.length >= 6) {
    const projected = (spent / day) * daysInMonth;
    if (projected > Math.max(...monthTotals)) {
      add(4, `În ritmul actual, ${thisMonthName} ar fi cea mai scumpă lună din ultimul an. Ce o face atât de scumpă?`);
    } else if (projected < Math.min(...monthTotals)) {
      add(3, `${calendarMonthName(thisMonth)} pare cea mai ieftină lună din ultimul an. Ce fac diferit?`);
    }
  }

  // Fast pace early in the month.
  if (day <= 15 && avgMonth > 0 && spent > avgMonth * 0.7) {
    add(
      3,
      `Am cheltuit deja ${Math.round((spent / avgMonth) * 100)}% din media lunară, deși suntem abia pe ${day}. Cât îmi mai permit până la final de lună?`
    );
  }

  // A regular category that has not shown up yet.
  const missing = [...pastByCat.entries()]
    .map(([cat, list]) => {
      const byMonth = groupBy(list, (i) => i.month);
      const firstDays = [...byMonth.values()].map((l) => Math.min(...l.map((i) => Number(i.date.slice(8)))));
      return { cat, months: byMonth.size, usualDay: Math.round(median(firstDays)) };
    })
    .filter((c) => c.months >= 10 && !currentByCat.has(c.cat) && day > c.usualDay + 3 && categoryLabel(c.cat))
    .sort((a, b) => a.usualDay - b.usualDay)[0];
  if (missing) {
    add(
      2,
      `Luna aceasta n-am avut încă cheltuieli la ${categoryLabel(missing.cat)}, deși de obicei apar până pe ${missing.usualDay}. Cât plătesc de obicei?`
    );
  }

  // A hashtag that is back (or new) after at least 6 months.
  const recentTags = new Set(inMonths(expenses, shiftMonth(thisMonth, -6), lastMonth).flatMap(tagsOf));
  const newTag = topEntry(sumBy(current, (i) => tagsOf(i).filter((t) => !recentTags.has(t))));
  if (newTag) {
    add(2, `Cât m-a costat #${newTag[0]} luna aceasta? Nu a mai apărut în ultimele 6 luni.`);
  }

  // Unusually high income this month.
  const incomeNow = sum(inMonths(incomes, thisMonth, thisMonth));
  const incomeTotals = [...sumBy(inMonths(incomes, shiftMonth(thisMonth, -12), lastMonth), (i) => i.month).values()];
  const avgIncome = incomeTotals.length ? incomeTotals.reduce((a, b) => a + b, 0) / incomeTotals.length : 0;
  if (incomeTotals.length >= 6 && incomeNow > avgIncome * 1.3) {
    add(2, `Venitul din ${thisMonthName} e peste media obișnuită. Cum l-aș putea folosi cel mai bine?`);
  }

  // Last weekend compared with recent weekends.
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  const lastSunday = shiftDay(today, weekday === 0 ? -7 : -weekday);
  const weekendTotal = (sunday: string) => {
    const saturday = shiftDay(sunday, -1);
    return sum(expenses.filter((i) => i.date === saturday || i.date === sunday));
  };
  const lastWeekend = weekendTotal(lastSunday);
  const previousWeekends = Array.from({ length: 12 }, (_, w) => weekendTotal(shiftDay(lastSunday, -7 * (w + 1))));
  const typicalWeekend = median(previousWeekends);
  if (typicalWeekend > 0 && lastWeekend > typicalWeekend * 2) {
    add(
      2,
      `Weekendul trecut am cheltuit de ${(lastWeekend / typicalWeekend).toFixed(1)} ori mai mult decât de obicei. Pe ce s-au dus banii?`
    );
  }

  // A recurring payment that got more expensive (needs descriptions).
  if (shareDescriptions) {
    const recurring = groupBy(inMonths(expenses, shiftMonth(thisMonth, -7), thisMonth), (i) => i.search);
    const priceChange = [...recurring.values()]
      .map((list) => {
        const sorted = [...list].sort((a, b) => (a.date < b.date ? -1 : 1));
        const latest = sorted[sorted.length - 1];
        const earlier = sorted.slice(0, -1).map((i) => i.amount);
        const typical = median(earlier);
        const stable = earlier.every((a) => Math.abs(a - typical) <= typical * 0.05);
        const months = new Set(sorted.map((i) => i.month)).size;
        return { latest, typical, ok: months >= 4 && months >= sorted.length - 1 && stable && typical > 0 };
      })
      .filter((r) => r.ok && r.latest.month >= lastMonth && r.latest.amount > r.typical * 1.1 && r.latest.amount < r.typical * 3)
      .sort((a, b) => b.latest.amount / b.typical - a.latest.amount / a.typical)[0];
    if (priceChange) {
      add(
        3,
        `„${priceChange.latest.desc}” s-a scumpit de la ${fmt(priceChange.typical)} la ${fmt(priceChange.latest.amount)}. Cât mă costă acum pe an?`
      );
    }
  }

  // --- Calendar context ---------------------------------------------------

  // Next month is usually more expensive than average.
  const nextMonth = shiftMonth(thisMonth, 1);
  const history = expenses.filter((i) => i.month < thisMonth);
  const totalsByMonth = sumBy(history, (i) => i.month);
  const sameCalendarMonth = [...totalsByMonth.entries()]
    .filter(([month]) => month.slice(5) === nextMonth.slice(5))
    .map(([, total]) => total);
  const allMonths = [...totalsByMonth.values()];
  const overallAvg = allMonths.length ? allMonths.reduce((a, b) => a + b, 0) / allMonths.length : 0;
  const nextAvg = sameCalendarMonth.length
    ? sameCalendarMonth.reduce((a, b) => a + b, 0) / sameCalendarMonth.length
    : 0;
  if (sameCalendarMonth.length >= 2 && nextAvg > overallAvg * 1.15) {
    add(
      2,
      `${calendarMonthName(nextMonth)} e de obicei cu ${Math.round((nextAvg / overallAvg - 1) * 100)}% mai scumpă decât media. La ce să mă pregătesc?`
    );
  }

  // Year to date compared with the same period last year.
  const yearStart = `${year}-01-01`;
  const lastYearToday = `${year - 1}${today.slice(4)}`;
  const ytd = sum(expenses.filter((i) => i.date >= yearStart && i.date <= today));
  const ytdLastYear = sum(expenses.filter((i) => i.date >= `${year - 1}-01-01` && i.date <= lastYearToday));
  if (monthNumber >= 3 && ytdLastYear > 0 && Math.abs(ytd / ytdLastYear - 1) > 0.1) {
    const pct = Math.round(Math.abs(ytd / ytdLastYear - 1) * 100);
    add(
      2,
      `Anul acesta am cheltuit cu ${pct}% ${ytd > ytdLastYear ? 'mai mult' : 'mai puțin'} decât în aceeași perioadă a anului trecut. Ce s-a schimbat?`
    );
  }

  // --- General personal ---------------------------------------------------

  const lastYear = inMonths(expenses, shiftMonth(thisMonth, -11), thisMonth);
  const tag = topEntry(sumBy(lastYear, tagsOf));
  if (tag && tag[0] !== newTag?.[0]) add(1, `Cât mă costă #${tag[0]} pe an și cum a evoluat?`);

  const lastMonthYearAgo = shiftMonth(lastMonth, -12);
  if (expenses.some((i) => i.month === lastMonthYearAgo)) {
    add(1, `Cum arată ${monthName(lastMonth)} față de ${monthName(lastMonthYearAgo)}?`);
  }

  const recent = sumBy(lastYear, (i) => i.cat);
  const before = sumBy(inMonths(expenses, shiftMonth(thisMonth, -23), shiftMonth(thisMonth, -12)), (i) => i.cat);
  const growth = [...recent.entries()]
    .map(([cat, total]) => ({ cat, total, prev: before.get(cat) || 0 }))
    .filter((c) => c.prev > 0 && c.total > c.prev * 1.15 && categoryLabel(c.cat) && c.cat !== rising?.cat)
    .sort((a, b) => b.total - b.prev - (a.total - a.prev))[0];
  if (growth) {
    add(1, `De ce a crescut ${categoryLabel(growth.cat)} în ultimele 12 luni față de anul anterior?`);
  }

  const top = topEntry(sumBy(inMonths(expenses, lastMonth, lastMonth), (i) => i.cat));
  if (top && categoryLabel(top[0])) {
    add(1, `Pe ce anume am cheltuit la ${categoryLabel(top[0])} în ${monthName(lastMonth)}?`);
  }

  return prompts;
};
