import React, { useRef, useState } from 'react';
import { MdDelete, MdEdit } from 'react-icons/md';
import { useAuthDispatch, useAuthState, useNotification, useLoan } from '../context';
import { AuthState } from '../type/types';
import useSwipeActions from '../hooks/useSwipeActions';
import { FaPen, FaTrash } from 'react-icons/fa';
import { deleteNode, fetchLoans } from '../utils/utils';
import { notificationType } from '../utils/constants';
import Modal from './Modal';
import PaymentForm from './PaymentForm';

const PaymentDetails = (props) => {
  const payments = props?.payments ?? [];
  const loan = props?.loan ?? {};
  const tableRef = useRef(null);
  const showNotification = useNotification();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isNewModal, setIsNewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { dataDispatch } = useLoan();
  const { token } = useAuthState() as AuthState;
  const dispatch = useAuthDispatch();
  const [focusedItem, setFocusedItem] = useState({
    field_date: new Date().toISOString().slice(0, 10),
    field_rate: '',
    field_pay_installment: '',
    field_pay_single_fee: '',
  });

  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    deleteVisible,
    editVisible,
    extraRowStyle,
  } = useSwipeActions();

  const handleEdit = (nid: string) => {
    const item = payments?.find((item) => item.id === nid);
    setFocusedItem({
      nid: item.id,
      title: item.title,
      field_date: item.fdt,
      field_rate: item.fr,
      field_pay_installment: item.fpi,
      field_pay_single_fee: item.fpsf,
    });
    setShowEditModal(true);
  };

  const handleDelete = (showDeleteModal: boolean, token: string) => {
    setIsSubmitting(true);
    // @ts-expect-error
    deleteNode(showDeleteModal, token, (response) => {
      if (response.ok) {
        showNotification(
          'Payment was successfully deleted.',
          notificationType.SUCCESS
        );
        setIsSubmitting(false);
      } else {
        showNotification('Something went wrong.', notificationType.ERROR);
        setIsSubmitting(false);
      }
      setShowDeleteModal(false);
      fetchLoans(token, dataDispatch, dispatch);
    });
  };

  return (
    <div className="incomes-page">
      <button
        onClick={() => {
          setShowEditModal(true);
          setIsNewModal(true);
        }}
        className="button wide"
      >
        Add New Payment
      </button>

      <Modal
        show={showDeleteModal}
        onClose={(e) => {
          e.preventDefault();
          setShowDeleteModal(false);
        }}
      >
        <h3>Are you sure you want to delete the loan?</h3>
        <button
          onClick={() => handleDelete(showDeleteModal, token)}
          className="button wide"
        >
          {isSubmitting ? (
            <div className="loader">
              <span className="loader__element"></span>
              <span className="loader__element"></span>
              <span className="loader__element"></span>
            </div>
          ) : (
            <MdDelete />
          )}
        </button>
      </Modal>

      <Modal
        show={showEditModal}
        onClose={(e) => {
          e.preventDefault();
          setShowEditModal(false);
          setIsNewModal(false);
        }}
      >
        <PaymentForm
          formType={!isNewModal ? 'edit' : 'add'}
          values={focusedItem}
          startDate={loan.sdt}
          endDate={loan.edt}
          onSuccess={() => {
            setIsNewModal(false);
            setShowEditModal(false);
            fetchLoans(token, dataDispatch, dispatch);
          }}
        />
      </Modal>

      {payments.length ? (
        <div className="table-wrapper">
          <h2>Payments</h2>
          <table className="expenses-table" cellSpacing="0" cellPadding="0">
            <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th className="desktop-only"></th>
              <th className="desktop-only"></th>
            </tr>
            </thead>
            <tbody ref={tableRef}>
            {payments?.map((payment) => {
              return (
                <tr
                  key={payment.id}
                  data-id={payment.id}
                  onTouchStart={(e) =>
                    handleTouchStart(e, payment.id, tableRef)
                  }
                  onTouchMove={(e) => handleTouchMove(e, tableRef)}
                  onTouchEnd={(e) =>
                    handleTouchEnd(
                      e,
                      tableRef,
                      payment.id,
                      handleEdit,
                      setShowDeleteModal
                    )
                  }
                >
                  <td>{payment.fdt}</td>
                  <td>{payment.title}</td>
                  <td className="desktop-only">
                    <button
                      onClick={() => handleEdit(payment.id)}
                      className="btn-outline"
                    >
                      <MdEdit />
                    </button>
                  </td>
                  <td className="desktop-only">
                    <button
                      onClick={() => setShowDeleteModal(payment.id)}
                      className="btn-outline"
                    >
                      <MdDelete />
                    </button>
                  </td>
                </tr>
              );
            })}
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
      ) : (
        ''
      )}
    </div>
  );
};

export default PaymentDetails;
