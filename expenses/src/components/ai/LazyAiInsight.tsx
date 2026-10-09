import React, { Suspense } from 'react';
import type { InsightFeatureId } from '../../ai/insights/features';

const AiInsight = React.lazy(() => import('./AiInsight'));

const LazyAiInsight: React.FC<{ feature: InsightFeatureId; param?: string }> = (props) => (
  <Suspense fallback={null}>
    <AiInsight {...props} />
  </Suspense>
);

export default LazyAiInsight;
