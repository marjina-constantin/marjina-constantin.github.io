import React from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Model output is untrusted: raw HTML is never rendered and links are shown as plain text. */
const components: Components = {
  a: ({ children }) => <span className="ai-markdown__link">{children}</span>,
  img: () => null,
  table: ({ children }) => (
    <div className="ai-markdown__table">
      <table>{children}</table>
    </div>
  ),
};

const AiMarkdown: React.FC<{ text: string }> = ({ text }) => (
  <div className="ai-markdown">
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} skipHtml>
      {text}
    </ReactMarkdown>
  </div>
);

export default React.memo(AiMarkdown);
