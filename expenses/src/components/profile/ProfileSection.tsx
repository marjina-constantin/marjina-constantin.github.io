import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const STORAGE_KEY = 'profileSections';
const DEFAULT_OPEN: Record<string, boolean> = { appearance: true };

const readOpen = (id: string): boolean => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (typeof saved[id] === 'boolean') return saved[id];
  } catch {
    // ignore malformed value
  }
  return DEFAULT_OPEN[id] ?? false;
};

const writeOpen = (id: string, open: boolean) => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, [id]: open }));
  } catch {
    // Storage full: keep the open state in memory only.
  }
};

interface ProfileSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  summary?: string;
  children: React.ReactNode;
}

const ProfileSection = ({ id, title, icon, summary, children }: ProfileSectionProps) => {
  const [open, setOpen] = useState(() => readOpen(id));
  const contentId = `profile-section-${id}`;

  const toggle = () => {
    setOpen((current) => {
      const next = !current;
      writeOpen(id, next);
      return next;
    });
  };

  return (
    <section className={`profile-section${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="profile-section__header"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <span className="profile-section__icon" aria-hidden>
          {icon}
        </span>
        <span className="profile-section__heading">
          <span className="profile-section__title">{title}</span>
          {summary ? <span className="profile-section__summary">{summary}</span> : null}
        </span>
        <ChevronDown size={18} className="profile-section__chevron" aria-hidden />
      </button>
      <div
        id={contentId}
        className={`profile-section__collapse${open ? ' is-open' : ''}`}
        aria-hidden={!open}
      >
        <div className="profile-section__body">{children}</div>
      </div>
    </section>
  );
};

interface ProfileSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  labelledBy?: string;
  label?: string;
}

export const ProfileSwitch = ({
  checked,
  onChange,
  disabled,
  labelledBy,
  label,
}: ProfileSwitchProps) => (
  <label className={`profile-switch${disabled ? ' is-disabled' : ''}`}>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span className="toggle-slider" aria-hidden />
  </label>
);

export default ProfileSection;
