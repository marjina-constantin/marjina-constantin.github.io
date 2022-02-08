import React, {useEffect, useState} from "react";
import IncomeForm from "../../components/IncomeForm";
import {deleteNode, fetchData} from '../../utils/utils';
import {useAuthState, useData} from "../../context";
import Modal from "../../components/Modal";
import IncomeTable from "../../components/IncomeTable";

const Income = () => {
  const { userDetails, token } = useAuthState();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isNewModal, setIsNewModal] = useState(false);
  const { data, dataDispatch } = useData();
  const noData = data.groupedData === null;

  useEffect(() => {
    if (noData) {
      fetchData(token, dataDispatch);
    }
  }, [data]);

  const [focusedItem, setFocusedItem] = useState({})

  const handleEdit = (e) => {
    const values = JSON.parse(e.currentTarget.getAttribute("data-values"));
    setFocusedItem(values);
    setShowEditModal(true);
  }

  const handleDelete = (showDeleteModal, token) => {
    deleteNode(showDeleteModal, token, (response) => {
      if (response.ok) {
        alert('Transaction was successfully deleted.');
      }
      else {
        alert('Something went wrong.');
      }
      setShowDeleteModal(false);
      fetchData(token, dataDispatch);
    });
  };

  return (
    <div>
      <Modal show={showDeleteModal} onClose={(e) => {e.preventDefault(); setShowDeleteModal(false)}}>
        <h3>Are you sure you want to delete the income?</h3>
        <button onClick={() => handleDelete(showDeleteModal, token)} className="button logout">Yes, remove the income</button>
      </Modal>
      <Modal show={showEditModal} onClose={(e) => {e.preventDefault(); setShowEditModal(false); setIsNewModal(false)}}>
        <IncomeForm formType={!isNewModal ? "edit" : "add"} values={focusedItem} onSuccess={() => {
          setShowEditModal(false);
          fetchData(token, dataDispatch);
        }} />
      </Modal>
      <h2>Expenses</h2>
      <h4>Hi, {userDetails?.current_user?.name}!</h4>
      {noData ? '' :
        <div>
          <form className="add-transaction" onSubmit={() => {}}>
            <input type="submit" value="Add new income" onClick={(e) => {e.preventDefault(); setShowEditModal(true); setIsNewModal(true)}} onClose={(e) => {e.preventDefault(); setShowEditModal(false)}} />
          </form>

          {data.incomeData && data.incomeData.length ?
            <IncomeTable
              key={'income'}
              items={data.incomeData ?? []}
              handleEdit={handleEdit}
              setShowDeleteModal={setShowDeleteModal}
            /> : ''}

        </div>
      }
    </div>
  );
};

export default Income;
