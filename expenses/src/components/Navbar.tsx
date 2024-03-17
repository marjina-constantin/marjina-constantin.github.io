import { NavLink } from 'react-router-dom';
import { useAuthState } from '../context';
import {
  FaChartPie,
  FaHome,
  FaMoneyBill,
  FaPlus,
  FaUser,
} from 'react-icons/fa';
import React, { useState } from 'react';
import { AuthState } from '../type/types';

export default function Navbar() {
  const { userIsLoggedIn } = useAuthState() as AuthState;
  const [cssClass, setCssClass] = useState('closed');
  const [xDown, setXDown] = useState<number | null>(null);
  const [yDown, setYDown] = useState<number | null>(null);
  const handleTouchStart = (event: React.TouchEvent) => {
    const firstTouch = event.touches[0];
    setXDown(firstTouch.clientX);
    setYDown(firstTouch.clientY);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!xDown || !yDown) {
      return;
    }
    const xUp = event.touches[0].clientX;
    const yUp = event.touches[0].clientY;
    const xDiff = xDown - xUp;
    const yDiff = yDown - yUp;
    if (Math.abs(xDiff) < Math.abs(yDiff)) {
      if (yDiff > 0) {
        setCssClass('open');
      } else {
        setCssClass('closed');
      }
    }
    /* reset values */
    setXDown(null);
    setYDown(null);
  };

  return (
    <div
      className={`navbar ${cssClass}`}
      onTouchStart={(touchStartEvent) => handleTouchStart(touchStartEvent)}
      onTouchMove={(touchMoveEvent) => handleTouchMove(touchMoveEvent)}
    >
      <ul>
        <li>
          <NavLink to="/expenses/" end>
            <FaHome />
          </NavLink>
        </li>
        <li>
          <NavLink to="/expenses/charts">
            <FaChartPie />
          </NavLink>
        </li>
        <li>
          <NavLink to="/expenses/add-transaction">
            <FaPlus />
          </NavLink>
        </li>
        <li>
          <NavLink to="/expenses/income">
            <FaMoneyBill />
          </NavLink>
        </li>
        {userIsLoggedIn ? (
          <li>
            <NavLink to="/expenses/user">
              <FaUser />
            </NavLink>
          </li>
        ) : (
          ''
        )}
      </ul>
    </div>
  );
}
