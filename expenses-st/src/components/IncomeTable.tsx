// @ts-nocheck
import {useRef} from "react";
import useSwipeActions from "../hooks/useSwipeActions";
import {FaPen, FaTrash} from "react-icons/fa";
import {useSortableData, getClassNamesFor} from "../utils/useSortableData";
import {useAuthState} from "../context";
import {formatNumber} from "../utils/utils";

export default function IncomeTable({items, handleEdit, setShowDeleteModal}) {
  const total = items && items.length ? items.reduce((accumulator, curValue) => (parseFloat(accumulator) + (parseFloat(curValue['sum']) || 0)).toFixed(2), 0) : 0;
  const { sortedItems, requestSort, sortConfig } = useSortableData(items);
  const { currency } = useAuthState();
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
      <div className="month-badge">Incomes: {formatNumber(total)} {currency}</div>
      <table className="expenses-table" cellSpacing="0" cellPadding="0">
        <thead>
        <tr>
          <th>Date</th>
          <th onClick={() => requestSort('sum')} className={`sortable ${getClassNamesFor(sortConfig, 'sum')}`}>
            Amount
          </th>
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
            <td>{element.dt}</td>
            <td>{formatNumber(element.sum)}</td>
            <td>{element.dsc}</td>
            <td className="desktop-only">
              <button onClick={() => handleEdit(element.id)} className="btn-outline">Edit</button>
            </td>
            <td className="desktop-only">
              <button onClick={() => setShowDeleteModal(element.id)} className="btn-outline">Delete</button>
            </td>
          </tr>
        ))}
        </tbody>
      </table>
      {deleteVisible && <div style={{ ...extraRowStyle }}><div className="action delete"><FaTrash /></div></div>}
      {editVisible && <div style={{ ...extraRowStyle }}><div className="action edit"><FaPen /></div></div>}
    </div>
  )
}
