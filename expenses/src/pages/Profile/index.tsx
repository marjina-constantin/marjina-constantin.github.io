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
import { notificationType, themeList } from '../../utils/constants';
import { AuthState } from '../../types/types';
import AiSettings from '../../components/ai/AiSettings';
import { getAdapter, getStorageProvider } from '../../storage';

const Profile = () => {
  const showNotification = useNotification();
  const dispatch = useAuthDispatch();
  const { dataDispatch } = useData();
  const { userDetails, token, currency } = useAuthState() as AuthState;
  let { theme } = useAuthState() as AuthState;
  theme = themeList[theme] ? theme : 'blue-pink-gradient';
  const navigate = useNavigate();
  const handleLogout = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    logout(dispatch, dataDispatch);
    navigate('/expenses/login'); //navigate to logout page on logout
  };

  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    try {
      const profile = await getAdapter().saveProfile(
        token,
        userDetails.current_user.uid,
        { currency: value }
      );
      userDetails.current_user.currency = profile.currency;
      localStorage.setItem('currentUser', JSON.stringify(userDetails));
      dispatch &&
        dispatch({
          type: 'UPDATE_USER',
          payload: { currency: profile.currency },
        });
      setBlink(true);
      setTimeout(() => setBlink(false), 2000);
    } catch {
      showNotification(
        "Couldn't update your currency. Try again.",
        notificationType.ERROR
      );
    }
  };

  const handleThemeSelect = (themeId: string) => {
    localStorage.setItem('theme', JSON.stringify(themeId));
    dispatch &&
      dispatch({
        type: 'UPDATE_USER',
        payload: { theme: themeId },
      });
  };

  const onBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const name = event.target.name;
    event.preventDefault();
    localStorage.setItem(name, JSON.stringify(value));
    dispatch && dispatch({ type: 'UPDATE_USER', payload: { [name]: value } });
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
      <p className="storage-hint">
        {getStorageProvider() === 'drive'
          ? 'Stored in your Google Drive'
          : 'Stored on the app server'}
      </p>
      <div className="user-settings">
        <label className="currency-row">
          <span>Currency</span>
          <span className="currency-value">
            {currencies[currency as keyof typeof currencies]}
            <select
              value={currency}
              className="currency"
              name="currency"
              aria-label="Currency"
              onChange={handleChange}
            >
              {sortedCurrencies.map(([id, currency]) => (
                <option key={id} value={id}>
                  {currency}
                </option>
              ))}
            </select>
          </span>
        </label>
        <div className="theme-picker">
          {Object.entries(themeList).map(([id, { label, accent }]) => (
            <button
              key={id}
              type="button"
              className={`theme-swatch${theme === id ? ' active' : ''}`}
              onClick={() => handleThemeSelect(id)}
            >
              <div
                className="theme-swatch__preview"
                style={{ background: accent }}
              />
              <span className="theme-swatch__label">{label}</span>
            </button>
          ))}
        </div>
        <AiSettings />
        <button className="button logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
