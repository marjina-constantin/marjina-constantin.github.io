import { NavLink } from 'react-router-dom';
import { useAuthState } from '../context';
import {
  List,
  PieChart,
  PlusCircle,
  TrendingUp,
  User,
} from 'lucide-react';
import React from 'react';
import { AuthState } from '../types/types';

export default function Navbar() {
  const { userIsLoggedIn } = useAuthState() as AuthState;

  return (
    <div className="navbar">
      <ul>
        <li>
          <NavLink to="/expenses/" end>
            <List />
          </NavLink>
        </li>
        <li>
          <NavLink to="/expenses/charts">
            <PieChart />
          </NavLink>
        </li>
        <li>
          <NavLink to="/expenses/add-transaction">
            <PlusCircle />
          </NavLink>
        </li>
        <li>
          <NavLink to="/expenses/income">
            <TrendingUp />
          </NavLink>
        </li>
        {userIsLoggedIn ? (
          <li>
            <NavLink to="/expenses/user">
              <User />
            </NavLink>
          </li>
        ) : (
          ''
        )}
      </ul>
    </div>
  );
}
