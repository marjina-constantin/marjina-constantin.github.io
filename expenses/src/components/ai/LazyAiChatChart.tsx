import React, { Suspense } from 'react';
import type { ChatChart } from '../../ai/chart';

const AiChatChart = React.lazy(() => import('./AiChatChart'));

const LazyAiChatChart: React.FC<{ spec: ChatChart }> = ({ spec }) => (
  <Suspense fallback={<div className="ai-chat-chart ai-chat-chart--loading" />}>
    <AiChatChart spec={spec} />
  </Suspense>
);

export default LazyAiChatChart;
