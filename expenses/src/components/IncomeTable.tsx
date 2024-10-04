import React, { useEffect, useRef } from 'react';
import useSwipeActions from '../hooks/useSwipeActions';
import { FaPen, FaTrash } from 'react-icons/fa';
import { getClassNamesFor, useSortableData } from '../utils/useSortableData';
import { formatNumber } from '../utils/utils';
import { TransactionOrIncomeItem } from '../type/types';

interface IncomeTableProps {
  items: TransactionOrIncomeItem[];
  handleEdit: (id: string) => void;
  setShowDeleteModal: (id: string) => void;
  changedItems?: any
  handleClearChangedItem?: any
}

const IncomeTable: React.FC<IncomeTableProps> = ({
  items,
  handleEdit,
  setShowDeleteModal,
  handleClearChangedItem,
  changedItems,
}) => {
  const tableRef = useRef(null);
  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    deleteVisible,
    editVisible,
    extraRowStyle,
  } = useSwipeActions();

  useEffect(() => {
    Object.keys(changedItems).forEach((id) => {
      const timer = setTimeout(() => {
        handleClearChangedItem(id);
      }, 2000);
      return () => clearTimeout(timer);
    });
  }, [changedItems, handleClearChangedItem]);
  const allItems = [...items, ...Object.values(changedItems)
    .filter(item => item.type === 'removed' && item.data.type === 'incomes')
    .map(item => item.data)
  ].sort((a, b) => {
    // First, compare by 'dt'
    const dateComparison = new Date(b.dt).getTime() - new Date(a.dt).getTime();
    if (dateComparison !== 0) {
      return dateComparison;
    }
    // If 'dt' values are equal, compare by 'created'
    return b.cr - a.cr;
  });
  const { sortedItems, requestSort, sortConfig } = useSortableData(allItems || []);

  return (
    <div className="table-wrapper">
      <div className="month-badge">Incomes</div>
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
            <th>Description</th>
            <th className="desktop-only"></th>
            <th className="desktop-only"></th>
          </tr>
        </thead>
        <tbody ref={tableRef}>
          {sortedItems.map((element) => {
            const changeType = changedItems[element.id]?.type;
            return (
            <tr
              key={element.id}
              className={`transaction-item ${changeType || ''}`}
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
              <td>{element.dt}</td>
              <td>{formatNumber(element.sum)}</td>
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
          )})}
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
  );
};

export default IncomeTable;
