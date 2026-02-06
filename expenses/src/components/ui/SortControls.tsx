import React from 'react';
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { SortField, SortDirection } from '../../hooks/useListSort';

interface SortControlsProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

const getSortIcon = (
  field: SortField,
  currentField: SortField,
  direction: SortDirection
) => {
  if (currentField !== field) return <ArrowUpDown size={14} />;
  return direction === 'asc' ? (
    <ChevronUp size={14} />
  ) : (
    <ChevronDown size={14} />
  );
};

/**
 * Shared sort control buttons for Date and Amount columns.
 * Used by both TransactionList and IncomeList.
 */
const SortControls: React.FC<SortControlsProps> = ({
  sortField,
  sortDirection,
  onSort,
}) => (
  <div className="sort-controls">
    <button
      className={`sort-button ${sortField === 'date' ? 'active' : ''}`}
      onClick={() => onSort('date')}
    >
      Date {getSortIcon('date', sortField, sortDirection)}
    </button>
    <button
      className={`sort-button ${sortField === 'amount' ? 'active' : ''}`}
      onClick={() => onSort('amount')}
    >
      Amount {getSortIcon('amount', sortField, sortDirection)}
    </button>
  </div>
);

export default React.memo(SortControls);
