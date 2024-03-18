import React, { useState } from 'react';
import {
  logout,
  useAuthDispatch,
  useAuthState,
  useData,
  useNotification,
} from '../../context';
import { useNavigate } from 'react-router-dom';
import { currencies } from '../../utils/constants';
import { FaUserCircle } from 'react-icons/fa';
import { fetchRequest } from '../../utils/utils';
import { notificationType, themeList } from '../../utils/constants';
import { AuthState } from '../../type/types';

const Profile = () => {
  const showNotification = useNotification();
  const dispatch = useAuthDispatch();
  const { dataDispatch } = useData();
  const { userDetails, token, currency, weeklyBudget, monthlyBudget } =
    useAuthState() as AuthState;
  let { theme } = useAuthState() as AuthState;
  const [state, setState] = useState({
    weeklyBudget: weeklyBudget,
    monthlyBudget: monthlyBudget,
  });
  // @ts-expect-error
  theme = themeList[theme] ? theme : 'blue-pink-gradient';
  const navigate = useNavigate();
  const handleLogout = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    logout(dispatch, dataDispatch);
    navigate('/expenses/login'); //navigate to logout page on logout
  };

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const fetchOptions = {
      method: 'PATCH',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'JWT-Authorization': 'Bearer ' + token,
      }),
      body: JSON.stringify({ field_currency: [event.target.value] }),
    };
    const url = `https://dev-expenses-api.pantheonsite.io/user/${userDetails.current_user.uid}?_format=json`;
    fetchRequest(url, fetchOptions, dataDispatch, dispatch, (data: any) => {
      if (data.uid) {
        userDetails.current_user.currency = data.field_currency[0].value;
        localStorage.setItem('currentUser', JSON.stringify(userDetails));
        dispatch &&
          dispatch({
            type: 'UPDATE_USER',
            payload: { currency: data.field_currency[0].value },
          });
        setBlink(true);
        setTimeout(() => setBlink(false), 2000);
      } else {
        showNotification(
          'Something went wrong, please contact Constantin :)',
          notificationType.ERROR
        );
      }
    });
  };

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    localStorage.setItem('theme', JSON.stringify(event.target.value));
    dispatch &&
      dispatch({
        type: 'UPDATE_USER',
        payload: { theme: event.target.value },
      });
  };

  const onBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const name = event.target.name;
    event.preventDefault();
    localStorage.setItem(name, JSON.stringify(value));
    dispatch && dispatch({ type: 'UPDATE_USER', payload: { [name]: value } });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const name = event.target.name;
    event.preventDefault();
    setState({
      ...state,
      [name]: value,
    });
  };

  const sortedCurrencies = Object.entries(currencies).sort((a, b) => {
    return a[1] < b[1] ? -1 : 1;
  });
  const [blink, setBlink] = useState(false);

  return (
    <div className="user-page">
      <div className={blink ? 'user-avatar saved' : 'user-avatar'}>
        <FaUserCircle />
      </div>
      <h3>{userDetails.current_user.name}</h3>
      <div className="user-settings">
        <select
          value={currency}
          className="currency"
          name="currency"
          onChange={handleChange}
        >
          {sortedCurrencies.map(([id, currency]) => (
            <option key={id} value={id}>
              {currency}
            </option>
          ))}
        </select>
        <select
          value={theme}
          className="theme"
          name="theme"
          onChange={handleThemeChange}
        >
          {Object.entries(themeList).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <input
          required
          placeholder="Week Budget"
          type="number"
          name="weeklyBudget"
          value={state.weeklyBudget}
          onChange={handleInputChange}
          onBlur={onBlur}
        />
        <input
          required
          placeholder="Month Budget"
          type="number"
          name="monthlyBudget"
          value={state.monthlyBudget}
          onChange={handleInputChange}
          onBlur={onBlur}
        />
        <button className="button logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
