import React from "react";
import {logout, useAuthDispatch, useData} from "../../context";
import {useHistory} from "react-router-dom";

const Profile = () => {
  const dispatch = useAuthDispatch();
  const { dataDispatch } = useData();
  const history = useHistory();
  const handleLogout = (e) => {
    e.preventDefault();
    logout(dispatch, dataDispatch);
    history.push('/expenses/login') //navigate to logout page on logout
  }

  return (
    <div>
      <h3>Do you want to logout?</h3>
      <button className="button logout" onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Profile;
