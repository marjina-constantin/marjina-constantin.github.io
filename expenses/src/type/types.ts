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