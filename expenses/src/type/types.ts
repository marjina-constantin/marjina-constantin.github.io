export interface Item {
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
