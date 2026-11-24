import React from 'react';
import { Sparkles } from 'lucide-react';

const AgentHomeCard = () => {
  return (
    <section className="agent-home-card" aria-label="Cursor cloud agent message">
      <header className="agent-home-card__header">
        <span className="agent-home-card__mark" aria-hidden>
          <Sparkles size={18} strokeWidth={1.75} />
        </span>
        <div className="agent-home-card__meta">
          <p className="agent-home-card__product">Cursor Cloud Agent</p>
          <p className="agent-home-card__status">Done</p>
        </div>
      </header>
      <div className="agent-home-card__block">
        <p className="agent-home-card__label">Task</p>
        <p className="agent-home-card__task">
          Connect Cursor mobile to this app and put the result on the homepage.
        </p>
      </div>
      <div className="agent-home-card__block agent-home-card__block--result">
        <p className="agent-home-card__label">Result</p>
        <p className="agent-home-card__hello">Hello ta4ki devki</p>
      </div>
    </section>
  );
};

export default AgentHomeCard;
