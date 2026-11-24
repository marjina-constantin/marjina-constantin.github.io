import React, { Suspense } from 'react';
import { PageLoader } from '../../components/ui/LoadingSpinner';

const MonthReport = React.lazy(() => import('../MonthReport'));

const LazyMonthReport = () => (
  <Suspense fallback={<PageLoader />}>
    <MonthReport />
  </Suspense>
);

export default LazyMonthReport;
