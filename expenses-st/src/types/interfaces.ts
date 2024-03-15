export interface Item {
  dt: string;
  id: string;
  sum: string;
  type: string;
  cat?: string;
  dsc?: string;
}

export interface ItemTotal {
  [key: string]: string | number;
}

export interface CategoryTotal {
  name: string;
  y: number;
}

export interface CategoryTotals {
  [key: string]: CategoryTotal;
}

export interface YearData {
  [month: string]: number;
}

export interface DataStructure {
  [year: string]: YearData;
}
