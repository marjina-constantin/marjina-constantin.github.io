import React, {useState} from "react";
import {fetchRequest} from '../utils/utils'
import {useAuthDispatch, useAuthState, useData} from "../context";

const IncomeForm = ({formType, values, onSuccess}) => {
  const dispatch = useAuthDispatch();
  const { dataDispatch } = useData();
  const initialState = {
    field_amount: '',
    field_date: new Date().toISOString().substr(0,10),
    field_description: '',
  };
  const [formState, setFormState] = useState(formType === 'add' ? initialState : values);
  const { token } = useAuthState();
  const handleChange = (event) => {
    const value = event.target.value;
    setFormState({
      ...formState,
      [event.target.name]: value
    });
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    const node = {
      type: 'incomes',
      title: [formState.field_date],
      field_amount: [formState.field_amount],
      field_date: [formState.field_date],
      field_description: [formState.field_description],
    }
    const fetchOptions = {
      method: formType === 'add' ? 'POST' : 'PATCH',
      headers: new Headers({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'JWT-Authorization': 'Bearer ' + token
      }),
      body: JSON.stringify(node),
    };
    const url = formType === 'add' ?
      'https://dev-expenses-api.pantheonsite.io/node?_format=json' :
      `https://dev-expenses-api.pantheonsite.io/node/${values.nid}?_format=json`;
    fetchRequest(url, fetchOptions, dataDispatch, dispatch, (data) => {
      if (data.nid) {
        onSuccess();
        alert('Success!');
        setFormState(initialState);
      }
      else {
        alert('Something went wrong, please contact Sergiu S :)')
      }
    })
  };

  let today = new Date();
  const offset = today.getTimezoneOffset();
  today = new Date(today.getTime() - (offset*60*1000)).toISOString().split('T')[0];

  return (
    <div>
      <h2>{formType === 'add' ? 'Add income' : 'Edit income'}</h2>
      <form className="add-transaction" onSubmit={handleSubmit}>
        <input required placeholder="Amount" type="number" name="field_amount" value={formState.field_amount} onChange={handleChange} />
        <input required placeholder="Date" type="date" max={today} name="field_date" value={formState.field_date} onChange={handleChange} />
        <textarea placeholder="Description" name="field_description" rows="3" value={formState.field_description} onChange={handleChange} />
        <input type="submit" value={formType === 'add' ? 'Add income' : 'Edit income'} />
      </form>
    </div>
  );
};

export default IncomeForm;
