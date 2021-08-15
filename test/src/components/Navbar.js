import {NavLink} from 'react-router-dom'

export default function Navbar() {

    return (
        <div className="navbar">
            <ul>
                <li>
                    <NavLink
                        activeClassName="selected"
                        className="not-selected"
                        to="/test/build"
                        exact
                    >Home</NavLink>
                </li>
                <li>
                    <NavLink
                        to="/test/about"
                        activeClassName="selected"
                        className="not-selected"
                        exact
                    >About
                    </NavLink>
                </li>
            </ul>
        </div>
    )
}