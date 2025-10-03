import { NavLink } from 'react-router-dom';
import { useAuthState } from '../context';
import {
  List,
  PieChart,
  PlusCircle,
  TrendingUp,
  User,
} from 'lucide-react';
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

  // const handleTouchMove = (event: React.TouchEvent) => {
  //   if (!xDown || !yDown) {
  //     return;
  //   }
  //   const xUp = event.touches[0].clientX;
  //   const yUp = event.touches[0].clientY;
  //   const xDiff = xDown - xUp;
  //   const yDiff = yDown - yUp;
  //
  //   // This logic ensures the swipe is primarily vertical
  //   if (Math.abs(xDiff) < Math.abs(yDiff)) {
  //     if (yDiff > 0) {
  //       // Swiping Up (to open/reveal the navbar)
  //       setCssClass('open');
  //     } else {
  //       // Swiping Down (to close/hide the navbar)
  //       setCssClass('closed');
  //     }
  //   }
  //
  //   /* reset values */
  //   setXDown(null);
  //   setYDown(null);
  // };

  return (
    <div
      className={`navbar ${cssClass}`}
      // onTouchStart={(touchStartEvent) => handleTouchStart(touchStartEvent)}
      // onTouchMove={(touchMoveEvent) => handleTouchMove(touchMoveEvent)}
    >
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
