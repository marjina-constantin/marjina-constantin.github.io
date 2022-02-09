import React from "react";

export default function IncomeTable({items, handleEdit, setShowDeleteModal}) {
  const total = items && items.length ? items.reduce((accumulator, curValue) => parseInt(accumulator) + (parseInt(curValue['sum']) || 0), 0) : 0;
  return (
    <div className="table-wrapper">
      <div className="month-badge">Incomes: {total}</div>
      <table className="expenses-table" cellSpacing="0" cellPadding="0">
        <thead>
        <tr>
          <th>Date</th>
          <th>Amount</th>
          <th>Description</th>
          <th></th>
          <th></th>
        </tr>
        </thead>
        <tbody>
        {items.map((element) => (
          <tr key={element.id}>
            <td>{element.dt}</td>
            <td>{element.sum}</td>
            <td>{element.dsc}</td>
            <td>
              <button
                data-values={JSON.stringify({
                  nid: element.id,
                  field_date: element.dt,
                  field_amount: element.sum,
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
