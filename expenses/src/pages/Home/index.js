import React, {useEffect, useState} from "react";
import {useAuthDispatch, useAuthState, useData} from '../../context';
import {deleteNode, fetchData} from '../../utils/utils';
import Modal from '../../components/Modal';
import TransactionForm from "../../components/TransactionForm";
import TransactionsTable from "../../components/TransactionsTable";
import Filters from "../../components/Filters";

const Home = () => {
  const { token } = useAuthState();
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

  const [focusedItem, setFocusedItem] = useState({})

  const handleEdit = (e) => {
    const values = JSON.parse(e.currentTarget.getAttribute("data-values"));
    setFocusedItem(values);
    setShowEditModal(true);
  }

  const handleDelete = (showDeleteModal, token) => {
    setIsSubmitting(true);
    deleteNode(showDeleteModal, token, (response) => {
      if (response.ok) {
        alert('Transaction was successfully deleted.');
        setIsSubmitting(false);
      }
      else {
        alert('Something went wrong.');
        setIsSubmitting(false);
      }
      setShowDeleteModal(false);
      fetchData(token, dataDispatch, dispatch, data.category);
    });
  };

  const items = data.filtered || data;

  const [nrOfMonths, setNrOfMonths] = useState(2)

  return (
    <div>
      <Modal show={showDeleteModal} onClose={(e) => {e.preventDefault(); setShowDeleteModal(false)}}>
        <h3>Are you sure you want to delete the transaction?</h3>
        <button onClick={() => handleDelete(showDeleteModal, token)} className="button wide">
          {isSubmitting ? (
            <div className="loader">
              <span className="loader__element"></span>
              <span className="loader__element"></span>
              <span className="loader__element"></span>
            </div>
          ) : 'Yes, remove the transaction'
          }
        </button>
      </Modal>
      <Modal show={showEditModal} onClose={(e) => {e.preventDefault(); setShowEditModal(false)}}>
        <TransactionForm formType="edit" values={focusedItem} onSuccess={() => {
          setShowEditModal(false);
          fetchData(token, dataDispatch, dispatch, data.category);
        }} />
      </Modal>
      <h2>Expenses</h2>
      <Filters />
      {loading ? <div className="lds-ripple"><div></div><div></div></div> : noData ? '' :
        <div>
          {Object.keys(items.groupedData).map((monthName, id) => (
            id < nrOfMonths ?
              <TransactionsTable
                key={id}
                total={items.totals[monthName]}
                month={monthName}
                incomeTotals={items.incomeTotals}
                items={items.groupedData[monthName]}
                handleEdit={handleEdit}
                setShowDeleteModal={setShowDeleteModal}
              />
              : ''
          ))}
          {Object.keys(items.groupedData).length > nrOfMonths ?
            <div className="load-more"><button onClick={() => setNrOfMonths(nrOfMonths + 1)} className="btn-outline">Load more</button></div>
            : ''
          }
        </div>
      }
    </div>
  );
};

export default Home;
