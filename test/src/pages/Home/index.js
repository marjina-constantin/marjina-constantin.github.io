import React, {useEffect, useState} from "react";
import {useAuthState} from '../../context';
import {fetchRequest, deleteNode} from '../../utils/utils';
import Modal from '../../components/Modal';
import TransactionForm from "../../components/TransactionForm";

const Home = () => {
  const { userDetails, token } = useAuthState();
  const [data, setData] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchData = () => {
    const fetchOptions = {
      method: 'GET',
      headers: new Headers({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'JWT-Authorization': 'Bearer ' + token
      }),
    };
    fetchRequest('https://dev-expenses-api.pantheonsite.io/user-expenses?_format=json', fetchOptions, (data) => {
      let groupedData = {};
      let monthsTotals = {};
      data.forEach(item => {
        const date = new Date(item.field_date);
        const month = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
        if (!groupedData[month]) {
          groupedData[month] = [];
        }
        if (!monthsTotals[month]) {
          monthsTotals[month] = 0;
        }
        groupedData[month].push(item);
        monthsTotals[month] += parseInt(item.field_amount);
      });
      setData({groupedData: groupedData, totals: monthsTotals});
    });
  }

  useEffect(() => {
    fetchData();
  }, []);

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
      fetchData();
    });
  };

  return (
    <div>
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <h3>Are you sure you want to delete the transaction?</h3>
        <button onClick={() => handleDelete(showDeleteModal, token)} className="button logout">Yes, remove the transaction</button>
      </Modal>
      <Modal show={showEditModal} onClose={() => setShowEditModal(false)}>
        <TransactionForm formType="edit" values={focusedItem} onSuccess={() => {
          setShowEditModal(false);
          fetchData();
        }} />
      </Modal>
      <h2>Expenses</h2>
      <h4>Hi, {userDetails?.current_user?.name}!</h4>
      {Object.keys(data).length === 0 ? '' :
        <div>
          {Object.keys(data.groupedData).map((item, id) => (
            <div className="table-wrapper" key={id}>
              <div className="month-badge">{item}: {data.totals[item]}</div>
              <table className="expenses-table" cellSpacing="0" cellPadding="0">
                <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th></th>
                  <th></th>
                </tr>
                </thead>
                <tbody>
                {Object.keys(data.groupedData[item]).map((element, id) => (
                  <tr key={data.groupedData[item][id].nid}>
                    <td>{data.groupedData[item][id].field_date}</td>
                    <td>{data.groupedData[item][id].field_amount}</td>
                    <td>{data.groupedData[item][id].field_category_name}</td>
                    <td>{data.groupedData[item][id].field_description}</td>
                    <td>
                      <button
                        data-values={JSON.stringify({
                          nid: data.groupedData[item][id].nid,
                          field_date: data.groupedData[item][id].field_date,
                          field_amount: data.groupedData[item][id].field_amount,
                          field_category: data.groupedData[item][id].field_category,
                          field_description: data.groupedData[item][id].field_description,
                        })}
                        onClick={handleEdit}
                        className="btn-outline">
                        Edit
                      </button>
                    </td>
                    <td>
                      <button
                        data-nid={data.groupedData[item][id].nid}
                        onClick={(e) => setShowDeleteModal(e.currentTarget.getAttribute("data-nid"))}
                        className="btn-outline">
                          Delete
                      </button>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      }
    </div>
  );
};

export default Home;