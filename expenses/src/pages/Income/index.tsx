import React, { Suspense, useEffect, useState, useMemo } from 'react';
import IncomeForm from '../../components/IncomeForm';
import { deleteNode, fetchData } from '../../utils/utils';
import {
  useAuthDispatch,
  useAuthState,
  useData,
  useNotification,
} from '../../context';
import Modal from '../../components/Modal';
import IncomeList from '../../components/IncomeList';
import StatCard from '../../components/StatCard';
import { notificationType } from '../../utils/constants';
import YearIncomeAverageTrend from '../../components/YearIncomeAverageTrend';
import TotalIncomeCount from '../../components/TotalIncomeCount';
import { AuthState, TransactionOrIncomeItem } from '../../type/types';
import { ArrowUpCircle, TrendingUp } from 'lucide-react';

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
  const [nrOfItemsToShow, setNrOfItemsToShow] = useState(20);

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

  const handleClearChangedItem = (id: string) => {
    dataDispatch({ type: 'CLEAR_CHANGED_ITEM', id });
  };

  // Calculate income statistics
  const totalIncome = useMemo(() => {
    if (!data.incomeData || !data.incomeData.length) return 0;
    return data.incomeData.reduce(
      (sum: number, item: TransactionOrIncomeItem) =>
        sum + parseFloat(item.sum || '0'),
      0
    );
  }, [data.incomeData]);

  const averageIncome = useMemo(() => {
    if (!data.raw || !data.raw.length || totalIncome === 0) return 0;
    const firstDay = data.raw[data.raw.length - 1]?.dt;
    if (!firstDay) return 0;
    const daysPassed = (new Date().getTime() - new Date(firstDay).getTime()) / 86400000 + 1;
    const monthsPassed = daysPassed / 30.42;
    return totalIncome / monthsPassed;
  }, [data.raw, totalIncome]);

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
          className="button-primary"
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
            setIsNewModal(false);
            fetchData(token, dataDispatch, dispatch);
          }}
        />
      </Modal>
      <h2 style={{ padding: '0 1.5rem', marginBottom: '1rem' }}>Incomes</h2>
      {!noData && <TotalIncomeCount />}
      {noData ? (
        ''
      ) : (
        <div>
          {/* Stats Cards */}
          {data.incomeData && data.incomeData.length > 0 && (
            <div className="stats-grid">
              <StatCard
                icon={<ArrowUpCircle />}
                value={totalIncome}
                label="Total Income"
              />
              <StatCard
                icon={<TrendingUp />}
                value={averageIncome}
                label="Average Income"
              />
            </div>
          )}

          <div className="income-button-container">
            <button
              onClick={() => {
                setShowEditModal(true);
                setIsNewModal(true);
              }}
              className="button-primary income-add-button"
            >
              Add new income
            </button>
          </div>

          {data.incomeData && data.incomeData.length ? (
            <IncomeList
              transactions={data.incomeData.slice(0, nrOfItemsToShow)}
              onEdit={handleEdit}
              onDelete={(id) => setShowDeleteModal(id)}
              changedItems={data.changedItems}
              handleClearChangedItem={handleClearChangedItem}
            />
          ) : (
            ''
          )}

          {data.incomeData?.length > nrOfItemsToShow && (
            <div style={{ padding: '0 1.5rem', marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                onClick={() => setNrOfItemsToShow(nrOfItemsToShow + 10)}
                className="button-secondary"
              >
                Load more
              </button>
            </div>
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
