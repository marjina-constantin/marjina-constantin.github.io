import React, { useRef } from "react";
import { useSortableData } from '../utils/useSortableData';
import { categories as categoriesArray } from '../utils/constants';
import useSwipeActions from "../hooks/useSwipeActions";
import {FaTrash, FaPen} from "react-icons/fa";

const categories = categoriesArray.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

const TransactionsTable = ({ month, total, items, handleEdit, setShowDeleteModal, incomeTotals }) => {
  const { sortedItems, requestSort, sortConfig } = useSortableData(items);

  const getClassNamesFor = (name) => (sortConfig && sortConfig.key === name) ? sortConfig.direction : '';

  const income = incomeTotals ? incomeTotals[month] : -1;
  const profit = (income - total).toFixed(2);
  const message = income > 0
    ? `${month}: Income: ${income} - Expenses: ${total} = Profit: ${profit}`
    : `${month}: Expenses: ${total}`;

  const handleEdit1 = (id) => {
    const item = sortedItems.find((item) => item.id === id);
    console.log('Edit triggered for item: ', item);
  };

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
    <div className="table-wrapper">
      <div className="month-badge">{message}</div>
      <table className="expenses-table" cellSpacing="0" cellPadding="0">
        <thead>
        <tr>
          <th>Date</th>
          <th onClick={() => requestSort('sum')} className={`sortable ${getClassNamesFor('sum')}`}>Amount</th>
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
            onTouchEnd={() => handleTouchEnd(tableRef, element.id, handleEdit, setShowDeleteModal)}
          >
            <td>{element.dt.split('-')[2]}</td>
            <td>{element.sum}</td>
            <td>{categories[element.cat]}</td>
            <td>{element.dsc}</td>
            <td className="desktop-only">
              <button onClick={() => handleEdit(element.id)} className="btn-outline">Edit</button>
            </td>
            <td className="desktop-only">
              <button onClick={(e) => setShowDeleteModal(element.id)} className="btn-outline">Delete</button>
            </td>
          </tr>
        ))}
        </tbody>
      </table>
      {deleteVisible && <div style={{ ...extraRowStyle }}><div className="action delete"><FaTrash /></div></div>}
      {editVisible && <div style={{ ...extraRowStyle }}><div className="action edit"><FaPen /></div></div>}
    </div>
  );
};

export default TransactionsTable;
