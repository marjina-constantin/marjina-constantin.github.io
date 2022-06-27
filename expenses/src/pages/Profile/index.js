import React, {useState} from "react";
import {logout, useAuthDispatch, useAuthState, useData} from "../../context";
import {useHistory} from "react-router-dom";
import {currencies} from "../../utils/constants";
import {FaUserCircle} from "react-icons/fa";
import {fetchRequest} from "../../utils/utils";

const Profile = () => {
  const dispatch = useAuthDispatch();
  const { dataDispatch } = useData();
  const { userDetails, token, currency } = useAuthState();
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
    fetchRequest(url, fetchOptions, (data) => {
      if (data.uid) {
        userDetails.current_user.currency = data.field_currency[0].value;
        localStorage.setItem('currentUser', JSON.stringify(userDetails));
        dispatch({ type: 'UPDATE_USER', payload: {currency: data.field_currency[0].value} });
        setBlink(true);
        setTimeout(() => setBlink(false), 2000);
      }
      else {
        alert('Something went wrong, please contact Constantin :)')
      }
    })
  };

  const sortedCurrencies = Object.entries(currencies).sort((a,b) => { return a[1] < b[1] ? -1 : 1 });
  const [blink, setBlink] = useState(false);

  return (
    <div>
      <div className={blink ? 'user-avatar saved' : 'user-avatar'}><FaUserCircle /></div>
      <h3>{userDetails.current_user.name}</h3>
      <div className="user-currency">
        <select value={currency} className="currency" name="currency" onChange={handleChange}>
          {sortedCurrencies.map(([id, currency]) => (
            <option key={id} value={id}>{currency}</option>
          ))}
        </select>
      </div>
      <button className="button logout" onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Profile;
