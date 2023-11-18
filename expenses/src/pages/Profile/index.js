import React, {useState} from 'react';
import {logout, useAuthDispatch, useAuthState, useData, useNotification} from '../../context';
import {useHistory} from 'react-router-dom';
import {currencies} from '../../utils/constants';
import {FaUserCircle} from 'react-icons/fa';
import {fetchRequest} from '../../utils/utils';
import {notificationType} from '../../utils/constants';

const Profile = () => {
  const showNotification = useNotification();
  const dispatch = useAuthDispatch();
  const { dataDispatch } = useData();
  const { userDetails, token, currency, theme } = useAuthState();
  const history = useHistory();
  const handleLogout = (e) => {
    e.preventDefault();
    logout(dispatch, dataDispatch);
    history.push('/expenses/login') //navigate to logout page on logout
  }

  const handleChange = (event) => {
    const fetchOptions = {
      method: 'PATCH',
      headers: new Headers({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'JWT-Authorization': 'Bearer ' + token
      }),
      body: JSON.stringify({field_currency: [event.target.value]}),
    };
    const url = `https://dev-expenses-api.pantheonsite.io/user/${userDetails.current_user.uid}?_format=json`;
    fetchRequest(url, fetchOptions, dataDispatch, dispatch, (data) => {
      if (data.uid) {
        userDetails.current_user.currency = data.field_currency[0].value;
        localStorage.setItem('currentUser', JSON.stringify(userDetails));
        dispatch({ type: 'UPDATE_USER', payload: {currency: data.field_currency[0].value} });
        setBlink(true);
        setTimeout(() => setBlink(false), 2000);
      }
      else {
        showNotification('Something went wrong, please contact Constantin :)', notificationType.ERROR);
      }
    })
  };

  const handleThemeChange = (event) => {
    localStorage.setItem('theme', JSON.stringify(event.target.value));
    dispatch({ type: 'UPDATE_USER', payload: {theme: event.target.value} });
  };

  const sortedCurrencies = Object.entries(currencies).sort((a,b) => { return a[1] < b[1] ? -1 : 1 });
  const [blink, setBlink] = useState(false);

  return (
    <div className="user-page">
      <div className={blink ? 'user-avatar saved' : 'user-avatar'}><FaUserCircle /></div>
      <h3>{userDetails.current_user.name}</h3>
      <div className="user-settings">
        <select value={currency} className="currency" name="currency" onChange={handleChange}>
          {sortedCurrencies.map(([id, currency]) => (
            <option key={id} value={id}>{currency}</option>
          ))}
        </select>
        <select value={theme} className="theme" name="theme" onChange={handleThemeChange}>
          <option key="bondi-blue" value="bondi-blue">Bondi blue</option>
          <option key="maximum-green-yellow" value="maximum-green-yellow">Maximum green yellow</option>
          <option key="indian-red" value="indian-red">Indian red</option>
          <option key="carrot-orange" value="carrot-orange">Carrot Orange</option>
          <option key="saffron" value="saffron">Saffron</option>
          <option key="inchworm" value="inchworm">Inchworm</option>
          <option key="cadetblue" value="cadetblue">Cadetblue</option>
        </select>
        <button className="button logout" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default Profile;
