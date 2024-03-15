import TransactionForm from "../../components/TransactionForm";
import {fetchData} from '../../utils/utils';
import {useAuthDispatch, useAuthState, useData} from "../../context";

const AddTransaction = () => {
  // @ts-expect-error TBD
  const { token } = useAuthState();
  // @ts-expect-error TBD
  const { dataDispatch } = useData();
  const dispatch = useAuthDispatch();
  return (
    <TransactionForm formType="add" values={null} onSuccess={() => {fetchData(token, dataDispatch, dispatch);}}/>
  );
};

export default AddTransaction;
