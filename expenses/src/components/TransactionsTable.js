import React, {useRef} from "react";
import { useSortableData } from '../utils/useSortableData';
import {categories as categoriesArray, monthNames} from '../utils/constants';
import useSwipeActions from "../hooks/useSwipeActions";
import {FaTrash, FaPen} from "react-icons/fa";
import NumberDisplay from "./NumberDisplay";
import {useAuthState, useData} from "../context";

const categories = categoriesArray.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

const TransactionsTable = ({ month, total, items, handleEdit, setShowDeleteModal, incomeTotals }) => {
  const { sortedItems, requestSort, sortConfig } = useSortableData(items);

  const { data } = useData();

  // Get today's date
  const today = new Date();
  let totalSumForCategory;
  let percentage;
  const { weeklyToSpent } = useAuthState();

  if (!data?.filtered && `${monthNames[today.getMonth()]} ${today.getFullYear()}` === month && weeklyToSpent) {
    // Calculate the date of the last Monday
    const lastMonday = new Date(today);
    lastMonday.setDate(lastMonday.getDate() - ((today.getDay() + 6) % 7));
    // Format lastMonday to match 'YYYY-MM-DD' format
    const formattedLastMonday = lastMonday.toISOString().split('T')[0];

    totalSumForCategory = data?.raw?.filter(transaction => transaction.dt >= formattedLastMonday)
      ?.filter(transaction => [1, 2, 3, 4, 5, 7, 8].includes(parseInt(transaction.cat)))
      ?.reduce((total, transaction) => total + parseFloat(transaction.sum), 0) || 0;

    percentage = 100 - ((totalSumForCategory / parseInt(weeklyToSpent)) * 100);
  }

  const getClassNamesFor = (name) => (sortConfig && sortConfig.key === name) ? sortConfig.direction : '';

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
          <div className="stats-container has-budget" style={{'--budget-progress': '100%'}}>
            <h3>Spent</h3>
            <div className="stat-value"><NumberDisplay number={total} /></div>
          </div>
        </div>
        {income > 0 &&
          <div>
            <div className="stats-container">
              <h3>Income</h3>
              <div className="stat-value"><NumberDisplay number={income} /></div>
            </div>
          </div>
        }
        {income > 0 &&
          <div>
            <div className="stats-container">
              <h3>Profit</h3>
              <div className="stat-value"><NumberDisplay number={profit} /></div>
            </div>
          </div>
        }
        {(totalSumForCategory && percentage && weeklyToSpent) ? <div>
          <div className="stats-container has-budget" style={{'--budget-progress': `${percentage}%`}}>
            <h3>Week budget</h3>
            <div className="stat-value"><NumberDisplay number={totalSumForCategory} /></div>
            <div>of {weeklyToSpent}</div>
          </div>
        </div> : null}
      </div>
      <div className="table-wrapper">
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
              onTouchEnd={(e) => handleTouchEnd(e, tableRef, element.id, handleEdit, setShowDeleteModal)}
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
    </>
  );
};

export default TransactionsTable;
