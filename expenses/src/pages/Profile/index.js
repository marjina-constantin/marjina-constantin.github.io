import React from "react";
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
      }
      else {
        alert('Something went wrong, please contact Constantin :)')
      }
    })
  };

  return (
    <div>
      <div className="user-avatar"><FaUserCircle /></div>
      <h3>{userDetails.current_user.name}</h3>
      <select value={currency} className="currency" name="currency" onChange={handleChange}>
        {Object.entries(currencies).map(([id, currency]) => (
          <option key={id} value={id}>{currency}</option>
        ))}
      </select>
      <button className="button logout" onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Profile;
