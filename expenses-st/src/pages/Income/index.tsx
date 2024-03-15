import React, {Suspense, useEffect, useState} from "react";
import IncomeForm from '../../components/IncomeForm';
import {deleteNode, fetchData} from '../../utils/utils';
import {useAuthDispatch, useAuthState, useData, useNotification} from '../../context';
import Modal from '../../components/Modal';
import IncomeTable from '../../components/IncomeTable';
import {notificationType} from '../../utils/constants';
import YearIncomeAverageTrend from "../../components/YearIncomeAverageTrend";
import {Item} from '../../types/interfaces';

const Income = () => {
  // @ts-expect-error TBD
  const showNotification: (message: string, type: string) => void = useNotification();
  // @ts-expect-error TBD
  const { token } = useAuthState();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isNewModal, setIsNewModal] = useState(false);
  // @ts-expect-error TBD
  const { data, dataDispatch } = useData();
  const noData = data.groupedData === null;
  const dispatch = useAuthDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (noData) {
      fetchData(token, dataDispatch, dispatch);
    }
  }, [data, dataDispatch, noData, token, dispatch]);

  const [focusedItem, setFocusedItem] = useState({})

  const handleEdit = (id: string) => {
    const item = data.incomeData.find((item: Item) => item.id === id);
    setFocusedItem({
      nid: item.id,
      field_date: item.dt,
      field_amount: item.sum,
      field_category: item.cat,
      field_description: item.dsc
    });
    setShowEditModal(true);
  }

  // @ts-expect-error TBD
  const handleDelete = (showDeleteModal, token: string) => {
    setIsSubmitting(true);
    deleteNode(showDeleteModal, token, (response: any) => {
      if (response.ok) {
        showNotification('Income was successfully deleted.', notificationType.SUCCESS);
        setIsSubmitting(false);
      }
      else {
        showNotification('Something went wrong.', notificationType.ERROR);
        setIsSubmitting(false);
      }
      setShowDeleteModal(false);
      fetchData(token, dataDispatch, dispatch);
    });
  };

  return (
    <div className="incomes-page">
      <Modal show={showDeleteModal} onClose={(e: React.MouseEvent<HTMLButtonElement>) => {e.preventDefault(); setShowDeleteModal(false)}}>
        <h3>Are you sure you want to delete the income?</h3>
        <button onClick={() => handleDelete(showDeleteModal, token)} className="button wide">
          {isSubmitting ? (
            <div className="loader">
              <span className="loader__element"></span>
              <span className="loader__element"></span>
              <span className="loader__element"></span>
            </div>
          ) : 'Yes, remove the income'
          }
        </button>
      </Modal>
      <Modal show={showEditModal} onClose={(e: React.MouseEvent<HTMLButtonElement>) => {e.preventDefault(); setShowEditModal(false); setIsNewModal(false)}}>
        <IncomeForm formType={!isNewModal ? "edit" : "add"} values={focusedItem} onSuccess={() => {
          setShowEditModal(false);
          fetchData(token, dataDispatch, dispatch);
        }} />
      </Modal>
      <h2>Incomes</h2>
      {noData ? '' :
        <div>
          <button onClick={() => {setShowEditModal(true); setIsNewModal(true)}} className="button wide" >Add new income</button>

          {data.incomeData && data.incomeData.length ?
            <IncomeTable
              key={'income'}
              items={data.incomeData ?? []}
              handleEdit={handleEdit}
              setShowDeleteModal={setShowDeleteModal}
            /> : ''}

        </div>
      }
      {data.incomeData?.length ?
        <div className="charts-section">
          <Suspense fallback=''>
            <YearIncomeAverageTrend />
          </Suspense>
        </div>
        : ''
      }
    </div>
  );
};

export default Income;
