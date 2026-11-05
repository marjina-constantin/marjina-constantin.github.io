import React, { useCallback } from 'react';
import {
  useAuthDispatch,
  useAuthState,
  useData,
} from '../../context';
import { AuthState } from '../../types/types';
import { fetchData } from '../../utils/utils';
import { refreshTagCatalog } from '../../tags/store';
import PullToRefresh from '../ui/PullToRefresh';

const AppPullToRefresh: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token } = useAuthState() as AuthState;
  const { data, dataDispatch } = useData();
  const dispatch = useAuthDispatch();

  const handleRefresh = useCallback(() => {
    if (!token) {
      window.location.reload();
      return;
    }
    refreshTagCatalog();
    return fetchData(
      token,
      dataDispatch,
      dispatch,
      data?.category || '',
      data?.textFilter || ''
    );
  }, [token, dataDispatch, dispatch, data?.category, data?.textFilter]);

  return <PullToRefresh onRefresh={handleRefresh}>{children}</PullToRefresh>;
};

export default AppPullToRefresh;
