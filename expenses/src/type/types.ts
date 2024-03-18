export interface TransactionOrIncomeItem {
  dt: string;
  id: string;
  sum: string;
  type: string;
  cat?: string;
  dsc?: string;
}

export interface Daily {
  [dt: string]: number[];
}

export interface NodeData {
  changed: { value: string }[];
  created: { value: string }[];
  default_langcode: { value: boolean }[];
  field_amount: { value: string }[];
  field_date: { value: string }[];
  field_description: { value: string }[];
  langcode: { value: string }[];
  nid: { value: number }[];
  promote: { value: boolean }[];
  revision_log: { value: string }[];
  revision_timestamp: { value: string }[];
  revision_translation_affected: { value: boolean }[];
  revision_uid: { value: number }[];
  status: { value: boolean }[];
  sticky: { value: boolean }[];
  title: { value: string }[];
  type: { value: string }[];
  uid: { value: number }[];
  uuid: { value: string }[];
  vid: { value: number }[];
}

export interface AuthState {
  token: string;
  value: any;
  theme: string;
  currency: string;
  weeklyBudget: string;
  monthlyBudget: string;
  userIsLoggedIn: boolean;
  loading: boolean;
  errorMessage: null | any;
  userDetails: string | any;
}

export interface DataItems {
  raw: TransactionOrIncomeItem[];
  filtered_raw?: TransactionOrIncomeItem[];
  groupedData?: Record<string, TransactionOrIncomeItem[]> | null;
  totals?: Record<string, number> | null;
  filtered?: any;
  incomeData?: any;
  incomeTotals?: any;
  categoryTotals?: Record<string, { name: string; y: number }> | never[];
  loading: boolean;
  totalIncomePerYearAndMonth?: any;
  totalSpent: number;
  totalPerYear?: ItemTotal;
  category?: string;
  textFilter?: string;
  totalsPerYearAndMonth?: Record<string, Record<string, number>>;
  totalIncomePerYear?: ItemTotal;
}

export interface DataState {
  dataDispatch: (action: any) => void;
  data: DataItems;
}

export interface ItemTotal {
  [key: string]: string | number;
}

export interface LoginPayload {
  access_token: string;
}

export interface UserData {
  current_user: any;
  errors: string[];
}

export interface ActionType {
  type: string;
  payload?: any;
  error?: any;
  category?: string;
  textFilter?: string;
  groupedData?: Record<string, TransactionOrIncomeItem[]>;
  totals?: Record<string, number>;
  raw?: any[];
  incomeData?: any;
  incomeTotals?: any;
  categoryTotals?: Record<string, { name: string; y: number }>;
  loading?: boolean;
  totalSpent?: number;
  totalsPerYearAndMonth?: Record<string, Record<string, number>>;
  totalIncomePerYear?: ItemTotal;
  totalIncomePerYearAndMonth?: any;
  totalPerYear?: ItemTotal;
}

export interface Accumulator {
  groupedData: Record<string, TransactionOrIncomeItem[]>;
  totals: Record<string, number>;
  totalsPerYearAndMonth: Record<string, Record<string, number>>;
  totalPerYear: ItemTotal;
  totalSpent: number;
  categoryTotals: Record<string, { name: string; y: number }>;
}
