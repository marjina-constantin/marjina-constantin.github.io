import {NavLink} from 'react-router-dom'
import {useAuthState} from '../context'
import { FaHome, FaChartPie, FaUser, FaPlus, FaMoneyBill } from "react-icons/fa";
import {useState} from "react";

export default function Navbar() {
  const { userIsLoggedIn } = useAuthState();
  const [cssClass, setCssClass] = useState('closed');
  const [xDown, setXDown] = useState(null);
  const [yDown, setYDown] = useState(null);
  const handleTouchStart = (event) => {
    const firstTouch = event.touches[0];
    setXDown(firstTouch.clientX);
    setYDown(firstTouch.clientY);
  }

  const handleTouchMove = (event) => {
    if ( !xDown || !yDown ) {
      return;
    }
    const xUp = event.touches[0].clientX;
    const yUp = event.touches[0].clientY;
    const xDiff = xDown - xUp;
    const yDiff = yDown - yUp;
    if ( Math.abs( xDiff ) < Math.abs( yDiff ) ) {
      if ( yDiff > 0 ) {
        setCssClass('open');
      } else {
        setCssClass('closed');
      }
    }
    /* reset values */
    setXDown(null);
    setYDown(null);
  }

  return (
    <div className={`navbar ${cssClass}`}
      onTouchStart={touchStartEvent => handleTouchStart(touchStartEvent)}
      onTouchMove={touchMoveEvent => handleTouchMove(touchMoveEvent)}
     >
      <ul>
        <li>
          <NavLink
            // onClick={() => setCssClass('closed')}
            activeclassname="selected"
            className="not-selected"
            to="/expenses/"
            exact="true"
          ><FaHome /></NavLink>
        </li>
        <li>
          <NavLink
            // onClick={() => setCssClass('closed')}
            to="/expenses/charts"
            activeclassname="selected"
            className="not-selected"
            exact="true"
          ><FaChartPie />
          </NavLink>
        </li>
        <li>
          <NavLink
            // onClick={() => setCssClass('closed')}
            to="/expenses/add-transaction"
            activeclassname="selected"
            className="not-selected"
            exact="true"
          ><FaPlus />
          </NavLink>
        </li>
        <li>
          <NavLink
            // onClick={() => setCssClass('closed')}
            to="/expenses/income"
            activeclassname="selected"
            className="not-selected"
            exact="true"
          ><FaMoneyBill />
          </NavLink>
        </li>
        {userIsLoggedIn ?
          <li>
            <NavLink
              // onClick={() => setCssClass('closed')}
              to="/expenses/user"
              activeclassname="selected"
              className="not-selected"
              exact="true"
            ><FaUser />
            </NavLink>
          </li> : ''
        }
      </ul>
    </div>
  )
}
