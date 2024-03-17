import React, { useState } from 'react';
import { fetchRequest } from '../utils/utils';
import {
  useAuthDispatch,
  useAuthState,
  useData,
  useNotification,
} from '../context';
import { categories, suggestions } from '../utils/constants';
import { notificationType } from '../utils/constants';
import { AuthState, DataState, NodeData } from '../type/types';

interface TransactionFormProps {
  formType: 'add' | 'edit';
  values: any;
  onSuccess: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  formType,
  values,
  onSuccess,
}) => {
  const showNotification = useNotification();
  const dispatch = useAuthDispatch();
  const { dataDispatch } = useData() as DataState;
  const initialState = {
    field_amount: '',
    field_date: new Date().toISOString().substr(0, 10),
    field_category: '',
    field_description: '',
  };
  const [formState, setFormState] = useState(
    formType === 'add' ? initialState : values
  );
  const { token } = useAuthState() as AuthState;
  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const value = event.target.value;
    setFormState({
      ...formState,
      [event.target.name]: value,
    });
    if (event.target.name === 'field_category') {
      // @ts-expect-error TBC
      setSuggestionData(suggestions[value]);
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const node = {
      type: 'transaction',
      title: [formState.field_date],
      field_amount: [formState.field_amount],
      field_category: [formState.field_category],
      field_date: [formState.field_date],
      field_description: [formState.field_description],
    };
    const fetchOptions = {
      method: formType === 'add' ? 'POST' : 'PATCH',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'JWT-Authorization': 'Bearer ' + token,
      }),
      body: JSON.stringify(node),
    };
    const url =
      formType === 'add'
        ? 'https://dev-expenses-api.pantheonsite.io/node?_format=json'
        : `https://dev-expenses-api.pantheonsite.io/node/${values.nid}?_format=json`;
    fetchRequest(
      url,
      fetchOptions,
      dataDispatch,
      dispatch,
      (data: NodeData) => {
        if (data.nid) {
          onSuccess();
          showNotification('Success!', notificationType.SUCCESS);
          setIsSubmitting(false);
          setFormState(initialState);
          setSuggestionData([]);
          setSelectedIndices([]);
        } else {
          showNotification(
            'Something went wrong, please contact Constantin :)',
            notificationType.ERROR
          );
          setIsSubmitting(false);
        }
      }
    );
  };

  const today: Date = new Date();
  const offset = today.getTimezoneOffset();
  const maxDay = new Date(today.getTime() - offset * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [suggestionData, setSuggestionData] = useState<string[]>(
    // @ts-expect-error TBC
    suggestions[formState.field_category]
  );
  const [selectedIndices, setSelectedIndices] = useState<string[]>([]);

  const handleSuggestionClick = (suggestion: string, index: string) => {
    setFormState({
      ...formState,
      field_description: formState?.field_description
        ? formState.field_description + ` ${suggestion}`
        : suggestion,
    });
    const isSelected = selectedIndices.includes(index);
    if (isSelected) {
      return;
    }
    setSelectedIndices([...selectedIndices, index]);
  };
  return (
    <div>
      <h2>{formType === 'add' ? 'Add transaction' : 'Edit transaction'}</h2>
      <form className="add-transaction" onSubmit={handleSubmit}>
        <input
          required
          placeholder="Amount"
          type="number"
          name="field_amount"
          value={formState.field_amount}
          onChange={handleChange}
        />
        <input
          required
          placeholder="Date"
          type="date"
          max={maxDay}
          name="field_date"
          value={formState.field_date}
          onChange={handleChange}
        />
        <select
          required
          name="field_category"
          value={formState.field_category}
          onChange={handleChange}
        >
          {categories.map((category, id) => (
            <option key={id} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        <textarea
          placeholder="Description"
          name="field_description"
          rows={3}
          value={formState.field_description}
          onChange={handleChange}
        />
        {suggestionData.length ? (
          <ul className="suggestions">
            {suggestionData.map((suggestion, index) => (
              <li
                key={`${index}-${suggestion}`}
                onClick={() => {
                  handleSuggestionClick(suggestion, `${index}-${suggestion}`);
                }}
                className={
                  selectedIndices.includes(`${index}-${suggestion}`)
                    ? 'selected-suggestion'
                    : ''
                }
              >
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
          ) : formType === 'add' ? (
            'Add transaction'
          ) : (
            'Edit transaction'
          )}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
