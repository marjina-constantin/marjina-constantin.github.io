import React, {
  createContext,
  useContext,
  ReactNode,
  useReducer,
} from 'react';
import { initialLoanData, LoanReducer } from './reducer';

interface LoanContextProps {
  children: ReactNode;
}

export const LoanContext = createContext({
  data: { ...initialLoanData },
  dataDispatch: () => {},
});

export const useLoan = () => useContext(LoanContext);

export const LoanProvider = ({ children }: LoanContextProps) => {
  const [data, dataDispatch] = useReducer(LoanReducer, initialLoanData);

  return (
    <LoanContext.Provider value={{ data, dataDispatch }}>
      {children}
    </LoanContext.Provider>
  );
};
