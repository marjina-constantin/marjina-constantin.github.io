import Charts from "../pages/Charts";
import Home from "../pages/Home";
import Login from '../pages/Login';
import Logout from '../pages/Logout';
import AddTransaction from '../pages/AddTransaction';

const routes = [
  {
    path:'/test/build',
    component: Login,
    isPrivate: false,
  },
  {
    path:'/test/charts',
    component: Charts,
    isPrivate: true,
  },
  {
    path:'/test/home',
    component: Home,
    isPrivate: true,
  },
  {
    path:'/test/logout',
    component: Logout,
    isPrivate: true,
  },
  {
    path:'/test/add-transaction',
    component: AddTransaction,
    isPrivate: true,
  },
]

export default routes