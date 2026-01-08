import React, { useState, useEffect } from 'react';
import {
  useAuthDispatch,
  useAuthState,
  useData,
  useNotification,
} from '../context';
import { categories, suggestions } from '../utils/constants';
import { notificationType } from '../utils/constants';
import { AuthState, DataState, TransactionOrIncomeItem } from '../type/types';
import { addItemOffline, updateItemOffline } from '../utils/offlineAPI';
import { getItemFromDB } from '../utils/indexedDB';
import { fetchData, extractHashtags, addTagToText, removeTagFromText, hasTag } from '../utils/utils';

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
  const { data, dataDispatch } = useData() as DataState;
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
      // Reset selected tags when category changes
      setSelectedTags([]);
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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

    try {
      if (formType === 'add') {
        await addItemOffline(
          node,
          token,
          async (_item: TransactionOrIncomeItem) => {
            onSuccess();
            showNotification('Success!', notificationType.SUCCESS);
            setIsSubmitting(false);
            setFormState(initialState);
            setSuggestionData([]);
            setSelectedTags([]);
            // Refresh data to show new item
            setTimeout(() => {
              fetchData(
                token,
                dataDispatch,
                dispatch,
                data.category,
                data.textFilter
              );
            }, 0);
          },
          (error: string) => {
            showNotification(error, notificationType.ERROR);
            setIsSubmitting(false);
          }
        );
      } else {
        // Edit mode
        const existingItem = await getItemFromDB(values.nid);
        if (!existingItem) {
          showNotification(
            'Item not found in local cache',
            notificationType.ERROR
          );
          setIsSubmitting(false);
          return;
        }

        await updateItemOffline(
          node,
          values.nid,
          token,
          existingItem,
          async (_item: TransactionOrIncomeItem) => {
            onSuccess();
            showNotification('Success!', notificationType.SUCCESS);
            setIsSubmitting(false);
            setFormState(initialState);
            setSuggestionData([]);
            setSelectedTags([]);
            // Refresh data to show updated item
            setTimeout(() => {
              fetchData(
                token,
                dataDispatch,
                dispatch,
                data.category,
                data.textFilter
              );
            }, 0);
          },
          (error: string) => {
            showNotification(error, notificationType.ERROR);
            setIsSubmitting(false);
          }
        );
      }
    } catch (error) {
      showNotification(
        'Something went wrong, please contact Constantin :)',
        notificationType.ERROR
      );
      setIsSubmitting(false);
    }
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Initialize selected tags when editing based on existing hashtags
  useEffect(() => {
    if (formType === 'edit' && formState.field_description) {
      const existingTags = extractHashtags(formState.field_description);
      // Filter to only include tags that are in the current category's suggestions
      const validTags = existingTags.filter(tag => 
        suggestionData.some(suggestion => suggestion.toLowerCase() === tag.toLowerCase())
      );
      setSelectedTags(validTags);
    } else if (formType === 'add') {
      setSelectedTags([]);
    }
  }, [formType, formState.field_category, suggestionData]);

  const handleSuggestionClick = (suggestion: string) => {
    const hasTagInText = hasTag(formState.field_description, suggestion);
    let newDescription: string;
    
    if (hasTagInText) {
      // Remove tag if it exists
      newDescription = removeTagFromText(formState.field_description, suggestion);
      setSelectedTags(selectedTags.filter(t => t !== suggestion));
    } else {
      // Add tag if it doesn't exist (to the end)
      newDescription = addTagToText(formState.field_description, suggestion);
      setSelectedTags([...selectedTags, suggestion]);
    }
    
    setFormState({
      ...formState,
      field_description: newDescription,
    });
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
            {suggestionData.map((suggestion) => {
              const isSelected = selectedTags.includes(suggestion) || hasTag(formState.field_description, suggestion);
              return (
                <li
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={isSelected ? 'selected-suggestion' : ''}
                >
                  #{suggestion}
                </li>
              );
            })}
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
