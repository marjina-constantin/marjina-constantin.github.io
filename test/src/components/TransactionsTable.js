import React from "react";
import { useSortableData } from '../utils/useSortableData';

export default function TransactionsTable({month, total, items, handleEdit, setShowDeleteModal}) {

  const { sortedItems, requestSort, sortConfig } = useSortableData(items);
  const getClassNamesFor = (name) => {
    if (!sortConfig) {
      return '';
    }
    return sortConfig.key === name ? sortConfig.direction : '';
  };

  return (
    <div className="table-wrapper">
      <div className="month-badge">{month}: {total}</div>
      <table className="expenses-table" cellSpacing="0" cellPadding="0">
        <thead>
        <tr>
          <th>Date</th>
          <th
            onClick={() => requestSort('field_amount')}
            className={ `sortable ${getClassNamesFor('field_amount')}` }
          >
            Amount
          </th>
          <th>Category</th>
          <th>Description</th>
          <th></th>
          <th></th>
        </tr>
        </thead>
        <tbody>
        {sortedItems.map((element, id) => (
          <tr key={element.nid}>
            <td>{element.field_date}</td>
            <td>{element.field_amount}</td>
            <td>{element.field_category_name}</td>
            <td>{element.field_description}</td>
            <td>
              <button
                data-values={JSON.stringify({
                  nid: element.nid,
                  field_date: element.field_date,
                  field_amount: element.field_amount,
                  field_category: element.field_category,
                  field_description: element.field_description,
                })}
                onClick={handleEdit}
                className="btn-outline">
                Edit
              </button>
            </td>
            <td>
              <button
                data-nid={element.nid}
                onClick={(e) => setShowDeleteModal(e.currentTarget.getAttribute("data-nid"))}
                className="btn-outline">
                Delete
              </button>
            </td>
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  )
}
