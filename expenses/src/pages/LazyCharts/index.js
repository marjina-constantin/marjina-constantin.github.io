import React, { Suspense } from "react";

const LazyCharts = () => {
  const Charts = React.lazy(() => import("../Charts"));
  return (
    <Suspense fallback={<div className="lds-ripple"><div></div><div></div></div>}>
      <Charts />
    </Suspense>
  );
};

export default LazyCharts;
