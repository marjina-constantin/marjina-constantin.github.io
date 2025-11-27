import React, { useEffect, useState, useMemo } from 'react';
import {
  useAuthDispatch,
  useAuthState,
  useData,
  useNotification,
} from '../../context';
import { deleteNode, fetchData } from '../../utils/utils';
import Modal from '../../components/Modal';
import TransactionForm from '../../components/TransactionForm';
import TransactionList from '../../components/TransactionList';
import Filters from '../../components/Filters';
import { notificationType, categories } from '../../utils/constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AuthState, TransactionOrIncomeItem } from '../../type/types';

const Home = () => {
  const showNotification = useNotification();
  const { token } = useAuthState() as AuthState;
  const [showDeleteModal, setShowDeleteModal] = useState<string | false>(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { data, dataDispatch } = useData();
  const noData = data.groupedData === null;
  const loading = data.loading;
  const dispatch = useAuthDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (noData && token) {
      fetchData(token, dataDispatch, dispatch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noData, token]); // Removed data, dataDispatch, dispatch from deps to avoid unnecessary re-fetches

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
          'Transaction was successfully deleted.',
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
        showNotification('Something went wrong.', notificationType.ERROR);
        setIsSubmitting(false);
      }
    });
  };

  const months = useMemo(
    () => items.groupedData ? Object.keys(items.groupedData) : [],
    [items.groupedData]
  );
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const currentMonth = useMemo(
    () => months[currentMonthIndex] ? months[currentMonthIndex] : months[0],
    [months, currentMonthIndex]
  );

  useEffect(() => {
    if (data?.filtered) {
      const index = Object.keys(months).find(
        // @ts-expect-error
        (key: string) => months[key] === currentMonth
      );
      setCurrentMonthIndex(parseInt(index as string));
    } else {
      setCurrentMonthIndex(0);
    }
  }, [data.filtered]);

  return (
    <div style={{ overflowX: 'hidden', width: '100%' }}>
      <Modal
        show={showDeleteModal}
        onClose={(e) => {
          e.preventDefault();
          setShowDeleteModal(false);
        }}
      >
        <h3>Are you sure you want to delete the transaction?</h3>
        <button
          onClick={() => confirmDelete(showDeleteModal)}
          className="button-primary"
        >
          {isSubmitting ? (
            <div className="loader">
              <span className="loader__element"></span>
              <span className="loader__element"></span>
              <span className="loader__element"></span>
            </div>
          ) : (
            'Yes, remove the transaction'
          )}
        </button>
      </Modal>
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
      <h2 style={{ padding: '0 1.5rem', marginBottom: '1rem' }}>{currentMonth || 'Expenses'}</h2>
      <Filters />
      {loading ? (
        <div className="lds-ripple" style={{ marginTop: '2rem' }}>
          <div></div>
          <div></div>
        </div>
      ) : noData ? (
        ''
      ) : (
        <div>
          {Object.keys(items.groupedData).length ? (
            <>
              <TransactionList
                transactions={items.groupedData[currentMonth]}
                categoryLabels={categories}
                onEdit={handleEdit}
                onDelete={(id) => setShowDeleteModal(id)}
                changedItems={data.changedItems}
                handleClearChangedItem={handleClearChangedItem}
                month={currentMonth}
                total={items.totals[currentMonth]}
                incomeTotals={items.incomeTotals}
              />
              <div className="pager-navigation">
                <button
                  disabled={!months[currentMonthIndex + 1]}
                  onClick={() => setCurrentMonthIndex(currentMonthIndex + 1)}
                >
                  <ChevronLeft />
                </button>

                <button
                  disabled={!months[currentMonthIndex - 1]}
                  onClick={() => setCurrentMonthIndex(currentMonthIndex - 1)}
                >
                  <ChevronRight />
                </button>
              </div>
            </>
          ) : (
            ''
          )}
        </div>
      )}
    </div>
  );
};

export default Home;