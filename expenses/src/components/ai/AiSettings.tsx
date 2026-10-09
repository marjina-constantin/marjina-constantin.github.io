import React, { useState } from 'react';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { useNotification } from '../../context';
import { notificationType } from '../../utils/constants';
import { useAiApiKey } from '../../ai/hooks/useAiApiKey';
import { maskApiKey } from '../../ai/apiKey';
import { describeAiError, testApiKey } from '../../ai/client';
import {
  getAiLanguage,
  getAiUsage,
  getShareDescriptions,
  setAiLanguage,
  setShareDescriptions,
} from '../../ai/storage';
import { AI_LANGUAGES } from '../../ai/config';
import { ButtonSpinner } from '../ui/LoadingSpinner';

const AiSettings = () => {
  const showNotification = useNotification();
  const { apiKey, status, save } = useAiApiKey();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [share, setShare] = useState(getShareDescriptions);
  const [language, setLanguage] = useState(getAiLanguage);
  const usage = getAiUsage();

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const key = draft.trim();
    if (!key) return;
    setBusy(true);
    try {
      await testApiKey(key);
    } catch (error) {
      showNotification(describeAiError(error), notificationType.ERROR);
      setBusy(false);
      return;
    }
    try {
      await save(key);
      setDraft('');
      setEditing(false);
      showNotification('Gemini API key saved.', notificationType.SUCCESS);
    } catch {
      showNotification("Couldn't save the key to your profile. Try again.", notificationType.ERROR);
    }
    setBusy(false);
  };

  const handleTest = async () => {
    setBusy(true);
    try {
      const model = await testApiKey(apiKey);
      showNotification(`Key works (${model}).`, notificationType.SUCCESS);
    } catch (error) {
      showNotification(describeAiError(error), notificationType.ERROR);
    }
    setBusy(false);
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      await save('');
      showNotification('Gemini API key removed.', notificationType.SUCCESS);
    } catch {
      showNotification("Couldn't remove the key. Try again.", notificationType.ERROR);
    }
    setBusy(false);
  };

  const toggleShare = () => {
    setShareDescriptions(!share);
    setShare(!share);
  };

  return (
    <div className="ai-settings">
      <div className="ai-settings__title">
        <Sparkles size={16} />
        <span>AI assistant</span>
      </div>

      {status === 'loading' ? (
        <div className="ai-settings__row">
          <span>Gemini API key</span>
          <ButtonSpinner />
        </div>
      ) : apiKey && !editing ? (
        <>
          <div className="ai-settings__row">
            <span>Gemini API key</span>
            <code className="ai-settings__key">{maskApiKey(apiKey)}</code>
          </div>
          <div className="ai-settings__actions">
            <button type="button" className="button-secondary" onClick={handleTest} disabled={busy}>
              Test
            </button>
            <button type="button" className="button-secondary" onClick={() => setEditing(true)} disabled={busy}>
              Change
            </button>
            <button type="button" className="button-secondary" onClick={handleRemove} disabled={busy}>
              Remove
            </button>
          </div>
        </>
      ) : (
        <form className="ai-settings__form" onSubmit={handleSave}>
          <div className="ai-settings__input">
            <input
              type={reveal ? 'text' : 'password'}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Paste your Gemini API key"
              autoComplete="off"
              spellCheck={false}
              aria-label="Gemini API key"
            />
            <button
              type="button"
              onClick={() => setReveal(!reveal)}
              aria-label={reveal ? 'Hide key' : 'Show key'}
            >
              {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="ai-settings__actions">
            <button type="submit" className="button" disabled={busy || !draft.trim()}>
              {busy ? <ButtonSpinner /> : 'Save key'}
            </button>
            {editing && (
              <button type="button" className="button-secondary" onClick={() => setEditing(false)} disabled={busy}>
                Cancel
              </button>
            )}
          </div>
          <p className="ai-settings__hint">
            Create a free key at{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
              aistudio.google.com/apikey
            </a>
            . Use a project without billing and restrict the key to the Gemini API.
          </p>
        </form>
      )}

      <label className="ai-settings__row">
        <span>Insights language</span>
        <select
          className="ai-settings__select"
          value={language}
          onChange={(e) => {
            setAiLanguage(e.target.value);
            setLanguage(e.target.value);
          }}
        >
          {AI_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </label>
      <label className="ai-settings__row ai-settings__toggle">
        <span>Share descriptions with AI</span>
        <input type="checkbox" checked={share} onChange={toggleShare} />
      </label>
      <p className="ai-settings__hint">
        When off, only dates, amounts, categories and hashtags are sent.
        {usage.requests > 0 && ` Today: ${usage.requests} requests, ${usage.tokens.toLocaleString()} tokens.`}
      </p>
    </div>
  );
};

export default AiSettings;
