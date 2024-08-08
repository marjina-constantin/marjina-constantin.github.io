import Charts from '../pages/Charts';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Profile from '../pages/Profile';
import AddTransaction from '../pages/AddTransaction';
import Income from '../pages/Income';
import Loans from '../pages/Loans';
import Loan from '../pages/Loan';

const routes = [
  {
    path: '/expenses/login',
    component: Login,
    isPrivate: false,
  },
  {
    path: '/expenses/charts',
    component: Charts,
    isPrivate: true,
  },
  {
    path: '/expenses',
    component: Home,
    isPrivate: true,
  },
  {
    path: '/expenses/user',
    component: Profile,
    isPrivate: true,
  },
  {
    path: '/expenses/add-transaction',
    component: AddTransaction,
    isPrivate: true,
  },
  {
    path: '/expenses/income',
    component: Income,
    isPrivate: true,
  },
  {
    path: '/expenses/loans',
    component: Loans,
    isPrivate: true,
  },
  {
    path: '/expenses/loan/:id',
    component: Loan,
    isPrivate: true,
  },
];

export default routes;
