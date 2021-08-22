import React, {useState} from "react";
import {fetchRequest} from '../utils/utils'
import {useAuthState} from "../context";

const TransactionForm = ({formType, values, onSuccess}) => {
  const initialState = {
    field_amount: '',
    field_date: new Date().toISOString().substr(0,10),
    field_category: '',
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
      type: 'transaction',
      title: [formState.field_date],
      field_amount: [formState.field_amount],
      field_category: [formState.field_category],
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
    fetchRequest(url, fetchOptions, (data) => {
      if (data.nid) {
        onSuccess();
        alert('Success!');
        setFormState(initialState);
      }
      else {
        alert('Something went wrong, please contact Constantin :)')
      }
    })
  };

  return (
    <div>
      <h2>{formType === 'add' ? 'Add transaction' : 'Edit transaction'}</h2>
      <form className="add-transaction" onSubmit={handleSubmit}>
        <input required placeholder="Amount" type="number" name="field_amount" value={formState.field_amount} onChange={handleChange} />
        <input required placeholder="Date" type="date" name="field_date" value={formState.field_date} onChange={handleChange} />
        <select required name="field_category" value={formState.field_category} onChange={handleChange}>
          <option value="">Category</option>
          <option value="1">Category 1</option>
          <option value="2">Category 2</option>
        </select>
        <textarea placeholder="Description" name="field_description" rows="3" value={formState.field_description} onChange={handleChange} />
        <input type="submit" value={formType === 'add' ? 'Add transaction' : 'Edit transaction'} />
      </form>
    </div>
  );
};

export default TransactionForm;
