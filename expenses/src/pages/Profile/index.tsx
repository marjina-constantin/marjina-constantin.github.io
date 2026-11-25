import React, { useState } from 'react';
import { Moon, Palette, Sun } from 'lucide-react';
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
import {
  appearanceList,
  persistAppearance,
  type Appearance,
} from '../../utils/appearance';
import { AuthState } from '../../types/types';
import AiSettings from '../../components/ai/AiSettings';
import BiometricSettings from '../../components/privacy/BiometricSettings';
import PrivacySettings from '../../components/privacy/PrivacySettings';
import ProfileSection from '../../components/profile/ProfileSection';
import TagSettings from '../../components/profile/TagSettings';

const Profile = () => {
  const showNotification = useNotification();
  const dispatch = useAuthDispatch();
  const { dataDispatch } = useData();
  const { userDetails, token, currency, appearance } =
    useAuthState() as AuthState;
  let { theme } = useAuthState() as AuthState;
  theme = themeList[theme] ? theme : 'blue-pink-gradient';
  const colorMode: Appearance = appearance === 'light' ? 'light' : 'dark';
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
          'Couldn\'t update your currency. Try again.',
          notificationType.ERROR
        );
      }
    });
  };

  const handleThemeSelect = (themeId: string) => {
    localStorage.setItem('theme', JSON.stringify(themeId));
    dispatch &&
      dispatch({
        type: 'UPDATE_USER',
        payload: { theme: themeId },
      });
  };

  const handleAppearanceSelect = (next: Appearance) => {
    persistAppearance(next);
    dispatch &&
      dispatch({
        type: 'UPDATE_USER',
        payload: { appearance: next },
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
      <div className="user-settings">
        <ProfileSection
          id="appearance"
          icon={<Palette size={16} />}
          title="Appearance"
          summary={`${currencies[currency as keyof typeof currencies]} · ${appearanceList[colorMode]} · ${themeList[theme].label}`}
        >
          <div className="appearance-mode">
            <span className="appearance-mode__label" id="appearance-mode-label">
              Mode
            </span>
            <div
              className="appearance-mode__options"
              role="group"
              aria-labelledby="appearance-mode-label"
            >
              <button
                type="button"
                className={colorMode === 'dark' ? 'is-active' : ''}
                aria-pressed={colorMode === 'dark'}
                onClick={() => handleAppearanceSelect('dark')}
              >
                <Moon size={15} aria-hidden />
                Dark
              </button>
              <button
                type="button"
                className={colorMode === 'light' ? 'is-active' : ''}
                aria-pressed={colorMode === 'light'}
                onClick={() => handleAppearanceSelect('light')}
              >
                <Sun size={15} aria-hidden />
                Light
              </button>
            </div>
          </div>
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
                {sortedCurrencies.map(([id, currencyName]) => (
                  <option key={id} value={id}>
                    {currencyName}
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
                aria-pressed={theme === id}
                aria-label={label}
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
        </ProfileSection>
        <TagSettings />
        <PrivacySettings />
        <BiometricSettings
          userId={String(userDetails?.current_user?.uid ?? '')}
          displayName={String(userDetails?.current_user?.name ?? '')}
        />
        <AiSettings />
        <button className="button logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
