import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthState, useData } from '../../context';
import { AuthState } from '../../types/types';
import { describeAiError } from '../client';
import { getAiItems } from '../data';
import {
  buildMonthScoreFacts,
  getMonthScoreSnapshot,
  monthLabelToKey,
  saveMonthScoreSnapshot,
} from '../monthScore';
import { generateMonthScoreWhy } from '../monthScoreWhy';
import { useAiApiKey } from './useAiApiKey';

const KEY_NEEDED = 'Gemini API key needed. Add it in Profile.';
const OFFLINE = 'You are offline. Connect to explain this score.';

export function useMonthScore(monthLabel?: string) {
  const { data } = useData();
  const { currency } = useAuthState() as AuthState;
  const { apiKey, status } = useAiApiKey();
  const items = useMemo(() => getAiItems(data.raw || []), [data.raw]);
  const monthKey = monthLabel ? monthLabelToKey(monthLabel) : null;
  const facts = useMemo(
    () => (monthKey ? buildMonthScoreFacts(items, monthKey) : null),
    [items, monthKey]
  );

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    setOpen(false);
    setText(null);
    setBusy(false);
  }, [monthKey]);

  useEffect(() => {
    if (!open || !facts) return;

    const snapshot = getMonthScoreSnapshot(facts.month);
    if (snapshot && snapshot.fingerprint === facts.fingerprint) {
      setText(snapshot.why);
      setBusy(false);
      return;
    }
    if (!navigator.onLine) {
      setText(OFFLINE);
      setBusy(false);
      return;
    }
    if (status === 'loading') {
      setText(null);
      setBusy(true);
      return;
    }
    if (status !== 'ready' || !apiKey) {
      setText(KEY_NEEDED);
      setBusy(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setBusy(true);
    setText(null);

    generateMonthScoreWhy(apiKey, facts, currency, controller.signal)
      .then((why) => {
        if (cancelled) return;
        saveMonthScoreSnapshot({
          month: facts.month,
          fingerprint: facts.fingerprint,
          why,
          generatedAt: Date.now(),
        });
        setText(why);
        setBusy(false);
      })
      .catch((error) => {
        if (cancelled || (error as Error)?.name === 'AbortError') return;
        setText(describeAiError(error));
        setBusy(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
      setBusy(false);
    };
  }, [apiKey, currency, facts, open, status]);

  useEffect(() => {
    if (!open || busy || !text) return;
    const timer = window.setTimeout(() => setOpen(false), 10000);
    return () => window.clearTimeout(timer);
  }, [busy, open, text]);

  const toggle = useCallback(() => {
    setOpen((current) => !current);
  }, []);

  return {
    facts,
    score: facts?.score ?? null,
    open,
    busy,
    text,
    toggle,
  };
}
