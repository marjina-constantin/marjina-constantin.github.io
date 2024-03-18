import React, { Suspense } from 'react';

const LazyCharts = () => {
  const Charts = React.lazy(() => import('../Charts'));
  return (
    <Suspense fallback="">
      <Charts />
    </Suspense>
  );
};

export default LazyCharts;
