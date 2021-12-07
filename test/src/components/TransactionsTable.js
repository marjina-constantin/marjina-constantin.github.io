import React from "react";
import { useSortableData } from '../utils/useSortableData';
import {categories as categoriesArray} from '../utils/constants';

const categories = {};
for (const item of categoriesArray) {
  categories[item.value] = item.label;
}

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
            onClick={() => requestSort('sum')}
            className={ `sortable ${getClassNamesFor('sum')}` }
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
          <tr key={element.id}>
            <td>{element.dt}</td>
            <td>{element.sum}</td>
            <td>{categories[element.cat]}</td>
            <td>{element.dsc}</td>
            <td>
              <button
                data-values={JSON.stringify({
                  nid: element.id,
                  field_date: element.dt,
                  field_amount: element.sum,
                  field_category: element.cat,
                  field_description: element.dsc,
                })}
                onClick={handleEdit}
                className="btn-outline">
                Edit
              </button>
            </td>
            <td>
              <button
                data-nid={element.id}
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
