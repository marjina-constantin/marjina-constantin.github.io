import { useEffect } from 'react';
import { useAuthDispatch, useAuthState, useData } from '../context';
import { fetchData } from '../utils/utils';
import { AuthState } from '../types/types';

/**
 * Encapsulates the repeated data-fetching logic used by Home, Charts, and Income pages.
 * Automatically fetches data from the API when it hasn't been loaded yet and a token is available.
 */
export function useDataFetcher() {
  const { token } = useAuthState() as AuthState;
  const { data, dataDispatch } = useData();
  const dispatch = useAuthDispatch();
  const noData = data.groupedData === null;
  const loading = data.loading;

  useEffect(() => {
    if (noData && token) {
      fetchData(token, dataDispatch, dispatch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noData, token]);

  return { data, dataDispatch, token, dispatch, noData, loading };
}
