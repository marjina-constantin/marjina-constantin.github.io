import React, { useRef } from 'react';
import { getClassNamesFor, useSortableData } from '../utils/useSortableData';
import { monthNames } from '../utils/constants';
import useSwipeActions from '../hooks/useSwipeActions';
import { FaPen, FaTrash } from 'react-icons/fa';
import NumberDisplay from './NumberDisplay';
import { useAuthState, useData } from '../context';
import { formatNumber, getCategory } from '../utils/utils';
import { AuthState, DataState, TransactionOrIncomeItem } from '../type/types';

interface TransactionsTableProps {
  month: string;
  total: number;
  items: TransactionOrIncomeItem[];
  handleEdit: (id: string) => void;
  setShowDeleteModal: (id: string) => void;
  incomeTotals: { [month: string]: number };
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  month,
  total,
  items,
  handleEdit,
  setShowDeleteModal,
  incomeTotals,
}) => {
  const { sortedItems, requestSort, sortConfig } = useSortableData(items || []);

  const { data } = useData() as DataState;

  // Get today's date
  const today = new Date();
  let totalSumForCategory = 0;
  let weekPercentage;
  let monthPercentage = 100;
  const { weeklyBudget, monthlyBudget } = useAuthState() as AuthState;
  const isCurrentMonth =
    `${monthNames[today.getMonth()]} ${today.getFullYear()}` === month;

  const isWeekBudget = !data?.filtered && isCurrentMonth && weeklyBudget;
  const isMonthBudget = !data?.filtered && isCurrentMonth && monthlyBudget;
  if (isMonthBudget) {
    monthPercentage = 100 - (total / parseInt(monthlyBudget)) * 100;
    monthPercentage = monthPercentage <= 0 ? 0.01 : monthPercentage;
  }
  if (isWeekBudget) {
    // Calculate the date of the last Monday
    const lastMonday = new Date(today);
    lastMonday.setDate(lastMonday.getDate() - ((today.getDay() + 6) % 7));
    // Get the parts of the date
    const year = lastMonday.getFullYear();
    const month = String(lastMonday.getMonth() + 1).padStart(2, '0');
    const day = String(lastMonday.getDate()).padStart(2, '0');
    // Form the formatted date string 'YYYY-MM-DD'
    const formattedLastMonday = `${year}-${month}-${day}`;

    totalSumForCategory =
      data?.raw
        ?.filter(
          (transaction: TransactionOrIncomeItem) =>
            transaction.dt >= formattedLastMonday
        )
        ?.filter(
          (transaction: TransactionOrIncomeItem) =>
            transaction.type === 'transaction'
        )
        ?.filter(
          (transaction: TransactionOrIncomeItem) =>
            ![6, 9, 10, 12, 13, 11].includes(
              parseInt(transaction.cat as string)
            )
        )
        ?.reduce(
          (total: number, transaction: TransactionOrIncomeItem) =>
            total + parseFloat(transaction.sum),
          0
        ) || 0;

    weekPercentage = 100 - (totalSumForCategory / parseInt(weeklyBudget)) * 100;
    weekPercentage = weekPercentage <= 0 ? 0.01 : weekPercentage;
  }

  const income = incomeTotals ? incomeTotals[month] : -1;
  const profit = parseFloat((income - total).toFixed(2));

  const tableRef = useRef(null);
  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    deleteVisible,
    editVisible,
    extraRowStyle,
  } = useSwipeActions();

  return (
    <>
      <div className="month-stats">
        <div>
          <div
            className="stats-container has-budget"
            // @ts-expect-error TBC
            style={{ '--budget-progress': `${monthPercentage}%` }}
          >
            <h3>Spent</h3>
            <div className="stat-value">
              <NumberDisplay number={total} />
            </div>
            {isMonthBudget && <div>of {formatNumber(monthlyBudget)}</div>}
          </div>
        </div>
        {income > 0 && (
          <div>
            <div className="stats-container">
              <h3>Income</h3>
              <div className="stat-value">
                <NumberDisplay number={income} />
              </div>
            </div>
          </div>
        )}
        {income > 0 && (
          <div>
            <div className="stats-container">
              <h3>Profit</h3>
              <div className="stat-value">
                <NumberDisplay number={profit} />
              </div>
            </div>
          </div>
        )}
        {isWeekBudget ? (
          <div>
            <div
              className="stats-container has-budget"
              style={{
                // @ts-expect-error TBC
                '--budget-progress': `${weekPercentage}%`,
              }}
            >
              <h3>Week budget</h3>
              <div className="stat-value">
                <NumberDisplay number={totalSumForCategory} />
              </div>
              <div>of {formatNumber(weeklyBudget)}</div>
            </div>
          </div>
        ) : null}
      </div>
      <div className="table-wrapper">
        <table className="expenses-table" cellSpacing="0" cellPadding="0">
          <thead>
            <tr>
              <th>Date</th>
              <th
                onClick={() => requestSort('sum')}
                className={`sortable ${getClassNamesFor(sortConfig, 'sum')}`}
              >
                Amount
              </th>
              <th>Category</th>
              <th>Description</th>
              <th className="desktop-only"></th>
              <th className="desktop-only"></th>
            </tr>
          </thead>
          <tbody ref={tableRef}>
            {sortedItems.map((element) => (
              <tr
                key={element.id}
                data-id={element.id}
                onTouchStart={(e) => handleTouchStart(e, element.id, tableRef)}
                onTouchMove={(e) => handleTouchMove(e, tableRef)}
                onTouchEnd={(e) =>
                  handleTouchEnd(
                    e,
                    tableRef,
                    element.id,
                    handleEdit,
                    setShowDeleteModal
                  )
                }
              >
                <td>{element.dt.split('-')[2]}</td>
                <td>{formatNumber(element.sum)}</td>
                <td>{getCategory[element.cat]}</td>
                <td>{element.dsc}</td>
                <td className="desktop-only">
                  <button
                    onClick={() => handleEdit(element.id)}
                    className="btn-outline"
                  >
                    Edit
                  </button>
                </td>
                <td className="desktop-only">
                  <button
                    onClick={() => setShowDeleteModal(element.id)}
                    className="btn-outline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {deleteVisible && (
          <div style={{ ...extraRowStyle }}>
            <div className="action delete">
              <FaTrash />
            </div>
          </div>
        )}
        {editVisible && (
          <div style={{ ...extraRowStyle }}>
            <div className="action edit">
              <FaPen />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TransactionsTable;
