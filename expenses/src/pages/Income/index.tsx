import React, { Suspense, useState, useMemo } from 'react';
import IncomeForm from '../../components/income/IncomeForm';
import { deleteNode, fetchData } from '../../utils/utils';
import { useNotification } from '../../context';
import Modal from '../../components/ui/Modal';
import ConfirmDeleteModal from '../../components/ui/ConfirmDeleteModal';
import IncomeList from '../../components/income/IncomeList';
import IncomeFilters from '../../components/income/IncomeFilters';
import StatCard from '../../components/ui/StatCard';
import { notificationType } from '../../utils/constants';
import YearIncomeAverageTrend from '../../components/charts/YearIncomeAverageTrend';
import TotalIncomeCount from '../../components/income/TotalIncomeCount';
import { TransactionOrIncomeItem } from '../../types/types';
import { ArrowUpCircle, TrendingUp } from 'lucide-react';
import { useDataFetcher } from '../../hooks/useDataFetcher';

const IncomeSources = React.lazy(
  () => import('../../components/charts/IncomeSources')
);

const Income = () => {
  const showNotification = useNotification();
  const { data, dataDispatch, token, dispatch, noData } = useDataFetcher();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isNewModal, setIsNewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nrOfItemsToShow, setNrOfItemsToShow] = useState(20);

  const [focusedItem, setFocusedItem] = useState({
    nid: '',
    field_date: '',
    field_amount: '',
    field_description: '',
  });

  const handleEdit = (id: string) => {
    const item = (displayIncomeData || data.incomeData || []).find(
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

  // Get filtered or unfiltered income data
  const displayIncomeData = data.filteredIncomeData !== null 
    ? data.filteredIncomeData 
    : data.incomeData;
  const hasIncomeData = displayIncomeData && displayIncomeData.length > 0;

  // Calculate income statistics based on displayed data
  const totalIncome = useMemo(() => {
    if (!displayIncomeData || !displayIncomeData.length) return 0;
    return displayIncomeData.reduce(
      (sum: number, item: TransactionOrIncomeItem) =>
        sum + parseFloat(item.sum || '0'),
      0
    );
  }, [displayIncomeData]);

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
      <ConfirmDeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => handleDelete(showDeleteModal, token)}
        isSubmitting={isSubmitting}
        itemLabel="income"
      />
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
      {!noData && <IncomeFilters />}

      {!noData && (
        <div>
          {hasIncomeData && (
            <div className="stats-grid">
              <StatCard icon={<ArrowUpCircle />} value={totalIncome} label="Total Income" />
              <StatCard icon={<TrendingUp />} value={averageIncome} label="Average Income" />
            </div>
          )}

          <div className="income-button-container">
            <button
              onClick={() => { setShowEditModal(true); setIsNewModal(true); }}
              className="button-primary income-add-button"
            >
              Add new income
            </button>
          </div>

          {hasIncomeData && (
            <IncomeList
              transactions={displayIncomeData!.slice(0, nrOfItemsToShow)}
              onEdit={handleEdit}
              onDelete={(id) => setShowDeleteModal(id)}
              changedItems={data.changedItems}
              handleClearChangedItem={handleClearChangedItem}
            />
          )}

          {hasIncomeData && displayIncomeData!.length > nrOfItemsToShow && (
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

      {hasIncomeData && (
        <>
          <div className="charts-section">
            <Suspense fallback=""><IncomeSources /></Suspense>
          </div>
          <div className="charts-section">
            <Suspense fallback=""><YearIncomeAverageTrend /></Suspense>
          </div>
        </>
      )}
    </div>
  );
};

export default Income;
