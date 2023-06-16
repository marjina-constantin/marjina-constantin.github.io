import React, {useState, useRef} from 'react';
import {fetchRequest} from '../utils/utils';
import {useAuthDispatch, useAuthState, useData} from '../context';
import {categories, suggestions} from '../utils/constants';

const TransactionForm = ({formType, values, onSuccess}) => {
  const dispatch = useAuthDispatch();
  const { dataDispatch } = useData();
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSubmitting(true);
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
    fetchRequest(url, fetchOptions, dataDispatch, dispatch, (data) => {
      if (data.nid) {
        onSuccess();
        alert('Success!');
        setIsSubmitting(false);
        setFormState(initialState);
      }
      else {
        alert('Something went wrong, please contact Constantin :)');
        setIsSubmitting(false);
      }
    })
  };

  let today = new Date();
  const offset = today.getTimezoneOffset();
  today = new Date(today.getTime() - (offset*60*1000)).toISOString().split('T')[0];

  const [suggestionData, setSuggestionData] = useState([]);
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);
  const handleInputFocus = () => {
    setSuggestionData(suggestions[formState?.field_category]);
  };

  const handleInputBlur = (event) => {
    // Check if the blur event target is within the suggestions container
    if (!suggestionsRef?.current?.contains(event?.relatedTarget)) {
      setSuggestionData([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setFormState({
      ...formState,
      field_description: formState?.field_description ? formState.field_description + ` ${suggestion}` : suggestion
    });
    // Return focus to the text input after selecting a suggestion
    inputRef.current.focus();
  };
  return (
    <div>
      <h2>{formType === 'add' ? 'Add transaction' : 'Edit transaction'}</h2>
      <form className="add-transaction" onSubmit={handleSubmit}>
        <input required placeholder="Amount" type="number" name="field_amount" value={formState.field_amount} onChange={handleChange} />
        <input required placeholder="Date" type="date" max={today} name="field_date" value={formState.field_date} onChange={handleChange} />
        <select required name="field_category" value={formState.field_category} onChange={handleChange}>
          {categories.map((category, id) => (
            <option key={id} value={category.value}>{category.label}</option>
          ))}
        </select>
        <textarea
          placeholder="Description"
          name="field_description"
          rows="3"
          value={formState.field_description}
          onChange={handleChange}
          onFocus={handleInputFocus}
          ref={inputRef}
          onBlur={handleInputBlur}
        />
        {suggestionData && suggestionData.length ? (
          <ul
            className="suggestions"
            ref={suggestionsRef}
            tabIndex={0}
          >
            {suggestionData.map((suggestion, index) => (
              <li key={index} tabIndex={-1} onClick={() => {
                handleSuggestionClick(suggestion)
              }}>
                {suggestion}
              </li>
            ))}
          </ul>
        ) : null}
        <button type="submit" disabled={isSubmitting} className="button w-100">
          {isSubmitting ? (
            <div className="loader">
              <span className="loader__element"></span>
              <span className="loader__element"></span>
              <span className="loader__element"></span>
            </div>
          ) : formType === 'add' ? 'Add transaction' : 'Edit transaction'
          }
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
