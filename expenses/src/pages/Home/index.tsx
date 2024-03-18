import React, { useEffect, useState } from 'react';
import {
  useAuthDispatch,
  useAuthState,
  useData,
  useNotification,
} from '../../context';
import { deleteNode, fetchData } from '../../utils/utils';
import Modal from '../../components/Modal';
import TransactionForm from '../../components/TransactionForm';
import TransactionsTable from '../../components/TransactionsTable';
import Filters from '../../components/Filters';
import { notificationType } from '../../utils/constants';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { AuthState, TransactionOrIncomeItem } from '../../type/types';

const Home = () => {
  const showNotification = useNotification();
  const { token } = useAuthState() as AuthState;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { data, dataDispatch } = useData();
  const noData = data.groupedData === null;
  const loading = data.loading;
  const dispatch = useAuthDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (noData) {
      fetchData(token, dataDispatch, dispatch);
    }
  }, [data, dataDispatch, token, noData, dispatch]);

  const items = data.filtered || data;

  const [focusedItem, setFocusedItem] = useState({});

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

  const handleDelete = (showDeleteModal: boolean, token: string) => {
    setIsSubmitting(true);
    // @ts-expect-error
    deleteNode(showDeleteModal, token, (response: Response) => {
      if (response.ok) {
        showNotification(
          'Transaction was successfully deleted.',
          notificationType.SUCCESS
        );
        setIsSubmitting(false);
      } else {
        showNotification('Something went wrong.', notificationType.ERROR);
        setIsSubmitting(false);
      }
      setShowDeleteModal(false);
      fetchData(
        token,
        dataDispatch,
        dispatch,
        data.category as string,
        data.textFilter as string
      );
    });
  };

  const months = items.groupedData ? Object.keys(items.groupedData) : [];
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const currentMonth = months[currentMonthIndex]
    ? months[currentMonthIndex]
    : months[0];

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
    <div>
      <Modal
        show={showDeleteModal}
        onClose={(e) => {
          e.preventDefault();
          setShowDeleteModal(false);
        }}
      >
        <h3>Are you sure you want to delete the transaction?</h3>
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
            fetchData(
              token,
              dataDispatch,
              dispatch,
              data.category,
              data.textFilter
            );
          }}
        />
      </Modal>
      <h2>{currentMonth || 'Expenses'}</h2>
      <Filters />
      {loading ? (
        <div className="lds-ripple">
          <div></div>
          <div></div>
        </div>
      ) : noData ? (
        ''
      ) : (
        <div>
          {Object.keys(items.groupedData).length ? (
            <>
              <TransactionsTable
                total={items.totals[currentMonth]}
                month={currentMonth}
                incomeTotals={items.incomeTotals}
                items={items.groupedData[currentMonth]}
                handleEdit={handleEdit}
                // @ts-expect-error
                setShowDeleteModal={setShowDeleteModal}
              />
              <div className="pager-navigation">
                <button
                  disabled={!months[currentMonthIndex + 1]}
                  onClick={() => setCurrentMonthIndex(currentMonthIndex + 1)}
                >
                  <FaArrowLeft />
                </button>
                <button
                  disabled={!months[currentMonthIndex - 1]}
                  onClick={() => setCurrentMonthIndex(currentMonthIndex - 1)}
                >
                  <FaArrowRight />
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
