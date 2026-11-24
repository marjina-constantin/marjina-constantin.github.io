import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthState, useData } from '../../context';
import { AuthState } from '../../types/types';
import { getAiItems } from '../data';
import { useAiApiKey } from './useAiApiKey';
import { getShareDescriptions } from '../storage';
import {
  MonthReportNarrative,
  MonthReportSnapshot,
  buildLocalNarrative,
  buildMonthReportFacts,
  clearMonthReportSnapshot,
  getMonthReportSnapshot,
  saveMonthReportSnapshot,
} from '../monthReport';
import { generateMonthReportNarrative } from '../monthReportNarrative';

export function useMonthReport(month: string | null) {
  const { data } = useData();
  const { currency } = useAuthState() as AuthState;
  const { apiKey, status: keyStatus } = useAiApiKey();
  const shareDescriptions = getShareDescriptions();
  const items = useMemo(() => getAiItems(data.raw || []), [data.raw]);
  const facts = useMemo(
    () => (month ? buildMonthReportFacts(items, month, shareDescriptions) : null),
    [items, month, shareDescriptions]
  );

  const [narrative, setNarrative] = useState<MonthReportNarrative | null>(null);
  const [source, setSource] = useState<'ai' | 'local' | null>(null);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const requestRef = useRef(0);
  const refresh = () => {
    if (month) clearMonthReportSnapshot(month);
    setRefreshToken((value) => value + 1);
  };

  useEffect(() => {
    if (!facts) {
      setNarrative(null);
      setSource(null);
      setStale(false);
      setBusy(false);
      return;
    }

    const local = buildLocalNarrative(facts);
    const snapshot = getMonthReportSnapshot(facts.month);
    const fingerprintOk = snapshot?.fingerprint === facts.fingerprint;
    const ready = fingerprintOk ? snapshot!.narrative : local;
    setNarrative(ready);
    setSource(fingerprintOk ? snapshot!.source : 'local');
    setStale(!!snapshot && !fingerprintOk);

    const canAskAi = keyStatus === 'ready' && !!apiKey && navigator.onLine;
    const needsAi = !fingerprintOk || snapshot?.source !== 'ai';
    if (!canAskAi || !needsAi) {
      if (!fingerprintOk) {
        saveMonthReportSnapshot({
          month: facts.month,
          fingerprint: facts.fingerprint,
          narrative: local,
          generatedAt: Date.now(),
          source: 'local',
        });
      }
      setBusy(false);
      return;
    }

    const id = ++requestRef.current;
    const controller = new AbortController();
    setBusy(true);
    generateMonthReportNarrative(apiKey, facts, local, currency, controller.signal)
      .then((next) => {
        if (requestRef.current !== id) return;
        const stored: MonthReportSnapshot = {
          month: facts.month,
          fingerprint: facts.fingerprint,
          narrative: next,
          generatedAt: Date.now(),
          source: 'ai',
        };
        saveMonthReportSnapshot(stored);
        setNarrative(next);
        setSource('ai');
        setStale(false);
      })
      .catch((error) => {
        if (requestRef.current !== id || error?.name === 'AbortError') return;
        saveMonthReportSnapshot({
          month: facts.month,
          fingerprint: facts.fingerprint,
          narrative: local,
          generatedAt: Date.now(),
          source: 'local',
        });
      })
      .finally(() => {
        if (requestRef.current === id) setBusy(false);
      });

    return () => controller.abort();
  }, [apiKey, currency, facts, keyStatus, refreshToken]);

  return { facts, narrative, source, stale, busy, refresh, items };
}
