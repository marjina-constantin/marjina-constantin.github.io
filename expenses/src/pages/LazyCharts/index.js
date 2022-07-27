import React, { Suspense } from "react";
import img from '../../images/Expenses.png'

const LazyCharts = () => {
  const Charts = React.lazy(() => import("../Charts"));
  return (
    <Suspense fallback={<img src={img} />}>
      <Charts />
    </Suspense>
  );
};

export default LazyCharts;
