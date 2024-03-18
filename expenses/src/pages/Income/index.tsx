import React, { Suspense, useEffect, useState } from 'react';
import IncomeForm from '../../components/IncomeForm';
import { deleteNode, fetchData } from '../../utils/utils';
import {
  useAuthDispatch,
  useAuthState,
  useData,
  useNotification,
} from '../../context';
import Modal from '../../components/Modal';
import IncomeTable from '../../components/IncomeTable';
import { notificationType } from '../../utils/constants';
import YearIncomeAverageTrend from '../../components/YearIncomeAverageTrend';
import { AuthState, TransactionOrIncomeItem } from '../../type/types';

const Income = () => {
  const showNotification = useNotification();
  const { token } = useAuthState() as AuthState;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isNewModal, setIsNewModal] = useState(false);
  const { data, dataDispatch } = useData();
  const noData = data.groupedData === null;
  const dispatch = useAuthDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (noData) {
      fetchData(token, dataDispatch, dispatch);
    }
  }, [data, dataDispatch, noData, token, dispatch]);

  const [focusedItem, setFocusedItem] = useState({
    nid: '',
    field_date: '',
    field_amount: '',
    field_description: '',
  });

  const handleEdit = (id: string) => {
    const item = data.incomeData.find(
      (item: TransactionOrIncomeItem) => item.id === id
    );
    setFocusedItem({
      nid: item.id,
      field_date: item.dt,
      field_amount: item.sum,
      field_description: item.dsc,
    });
    setShowEditModal(true);
  };

  const handleDelete = (showDeleteModal: boolean, token: string) => {
    setIsSubmitting(true);
    // @ts-expect-error
    deleteNode(showDeleteModal, token, (response) => {
      if (response.ok) {
        showNotification(
          'Income was successfully deleted.',
          notificationType.SUCCESS
        );
        setIsSubmitting(false);
      } else {
        showNotification('Something went wrong.', notificationType.ERROR);
        setIsSubmitting(false);
      }
      setShowDeleteModal(false);
      fetchData(token, dataDispatch, dispatch);
    });
  };

  return (
    <div className="incomes-page">
      <Modal
        show={showDeleteModal}
        onClose={(e) => {
          e.preventDefault();
          setShowDeleteModal(false);
        }}
      >
        <h3>Are you sure you want to delete the income?</h3>
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
            'Yes, remove the income'
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
        <IncomeForm
          formType={!isNewModal ? 'edit' : 'add'}
          values={focusedItem}
          onSuccess={() => {
            setShowEditModal(false);
            fetchData(token, dataDispatch, dispatch);
          }}
        />
      </Modal>
      <h2>Incomes</h2>
      {noData ? (
        ''
      ) : (
        <div>
          <button
            onClick={() => {
              setShowEditModal(true);
              setIsNewModal(true);
            }}
            className="button wide"
          >
            Add new income
          </button>

          {data.incomeData && data.incomeData.length ? (
            <IncomeTable
              key={'income'}
              items={data.incomeData ?? []}
              handleEdit={handleEdit}
              // @ts-expect-error
              setShowDeleteModal={setShowDeleteModal}
            />
          ) : (
            ''
          )}
        </div>
      )}
      {data.incomeData?.length ? (
        <div className="charts-section">
          <Suspense fallback="">
            <YearIncomeAverageTrend />
          </Suspense>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export default Income;
