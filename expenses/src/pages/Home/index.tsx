import React, { useEffect, useState, useMemo } from 'react';
import { useNotification } from '../../context';
import { deleteNode, fetchData } from '../../utils/utils';
import Modal from '../../components/ui/Modal';
import ConfirmDeleteModal from '../../components/ui/ConfirmDeleteModal';
import TransactionForm from '../../components/transactions/TransactionForm';
import TransactionList from '../../components/transactions/TransactionList';
import Filters from '../../components/transactions/Filters';
import { notificationType, categories } from '../../utils/constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TransactionOrIncomeItem } from '../../types/types';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { useDataFetcher } from '../../hooks/useDataFetcher';

const Home = () => {
  const showNotification = useNotification();
  const { data, dataDispatch, token, dispatch, noData, loading } = useDataFetcher();
  const [showDeleteModal, setShowDeleteModal] = useState<string | false>(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const items = data.filtered || data;

  const [focusedItem, setFocusedItem] = useState({});

  const handleClearChangedItem = (id: string) => {
    dataDispatch({ type: 'CLEAR_CHANGED_ITEM', id });
  };

  const handleEdit = (id: string) => {
    const item = items.groupedData[currentMonth].find(
      (item: TransactionOrIncomeItem) => item.id === id
    );
    setFocusedItem({
      nid: item.id,
      field_date: item.dt,
      field_amount: item.sum,
      field_category: item.cat,
      field_description: item.dsc,
    });
    setShowEditModal(true);
  };

  const confirmDelete = (id: string | false) => {
    if (!id) return;
    setIsSubmitting(true);
    deleteNode(id, token, (response: Response) => {
      setShowDeleteModal(false);
      if (response.ok) {
        showNotification(
          'Expense deleted.',
          notificationType.SUCCESS
        );
        setIsSubmitting(false);
        // Refetch in background - use setTimeout to avoid blocking UI
        setTimeout(() => {
          fetchData(
            token,
            dataDispatch,
            dispatch,
            data.category as string,
            data.textFilter as string
          );
        }, 0);
      } else {
        showNotification('Couldn\'t delete this expense. Try again.', notificationType.ERROR);
        setIsSubmitting(false);
      }
    });
  };

  const allMonths = useMemo(
    () => (data.groupedData ? Object.keys(data.groupedData) : []),
    [data.groupedData]
  );
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const currentMonth = allMonths[currentMonthIndex] || allMonths[0] || '';
  const monthTransactions = currentMonth
    ? items.groupedData?.[currentMonth]
    : undefined;

  useEffect(() => {
    if (allMonths.length === 0) return;
    if (currentMonthIndex < 0 || currentMonthIndex >= allMonths.length) {
      setCurrentMonthIndex(0);
    }
  }, [allMonths.length, currentMonthIndex]);

  return (
    <div style={{ overflowX: 'hidden', width: '100%' }}>
      <ConfirmDeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => confirmDelete(showDeleteModal)}
        isSubmitting={isSubmitting}
        itemLabel="expense"
        preview={(() => {
          if (!showDeleteModal || !items.groupedData?.[currentMonth]) return undefined;
          const item = items.groupedData[currentMonth].find(
            (entry: TransactionOrIncomeItem) => entry.id === showDeleteModal
          );
          if (!item) return undefined;
          return { date: item.dt, description: item.dsc, amount: item.sum };
        })()}
      />
      <Modal
        show={showEditModal}
        onClose={(e) => {
          e.preventDefault();
          setShowEditModal(false);
        }}
      >
        <TransactionForm
          formType="edit"
          values={focusedItem}
          onSuccess={() => {
            setShowEditModal(false);
            // Refetch in background - use setTimeout to avoid blocking UI
            setTimeout(() => {
              fetchData(
                token,
                dataDispatch,
                dispatch,
                data.category,
                data.textFilter
              );
            }, 0);
          }}
        />
      </Modal>
      <h2 className="page-title">{currentMonth || 'Expenses'}</h2>
      <Filters />

      {loading && <PageLoader />}

      {!loading && !noData && allMonths.length > 0 && (
        <>
          {!monthTransactions || monthTransactions.length === 0 ? (
            <p className="empty-month">No expenses this month.</p>
          ) : (
            <TransactionList
              transactions={monthTransactions}
              categoryLabels={categories}
              onEdit={handleEdit}
              onDelete={(id) => setShowDeleteModal(id)}
              changedItems={data.changedItems}
              handleClearChangedItem={handleClearChangedItem}
              month={currentMonth}
              total={items.totals[currentMonth]}
              incomeTotals={items.incomeTotals}
            />
          )}
          <div className="pager-navigation">
            <button
              disabled={!allMonths[currentMonthIndex + 1]}
              onClick={() => setCurrentMonthIndex(currentMonthIndex + 1)}
            >
              <ChevronLeft />
            </button>
            <button
              disabled={!allMonths[currentMonthIndex - 1]}
              onClick={() => setCurrentMonthIndex(currentMonthIndex - 1)}
            >
              <ChevronRight />
            </button>
          </div>
        </>
      )}

      {!loading && !noData && allMonths.length === 0 && (
        <p className="empty-month">No expenses yet.</p>
      )}
    </div>
  );
};

export default Home;