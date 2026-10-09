import React, { Suspense } from 'react';
import { PageLoader } from '../../components/ui/LoadingSpinner';

const Assistant = React.lazy(() => import('../Assistant'));

const LazyAssistant = () => (
  <Suspense fallback={<PageLoader />}>
    <Assistant />
  </Suspense>
);

export default LazyAssistant;
