import React, { useEffect, useState } from 'react';
import { Fingerprint } from 'lucide-react';
import ProfileSection, { ProfileSwitch } from '../profile/ProfileSection';
import {
  biometricErrorMessage,
  disableBiometric,
  enrollBiometric,
  isBiometricEnabled,
  isBiometricSupported,
  isPlatformAuthenticatorAvailable,
} from './biometricLock';

interface BiometricSettingsProps {
  userId: string;
  displayName: string;
}

const BiometricSettings = ({ userId, displayName }: BiometricSettingsProps) => {
  const [supported, setSupported] = useState(false);
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const hasApi = isBiometricSupported();
      const platform = hasApi
        ? await isPlatformAuthenticatorAvailable()
        : false;
      if (cancelled) return;
      setSupported(hasApi);
      setAvailable(platform);
      setEnabled(isBiometricEnabled(userId));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const statusLabel = !supported
    ? 'unavailable in this browser'
    : !available
      ? 'no Face ID / fingerprint / Windows Hello on this device'
      : enabled
        ? 'on for this device'
        : 'off';

  const onEnable = async () => {
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await enrollBiometric({ userId, displayName });
    setPending(false);
    if (result.error) {
      setError(biometricErrorMessage(result.error));
      return;
    }
    setEnabled(true);
    setMessage('Biometric unlock is on for this device.');
  };

  const onDisable = () => {
    if (!window.confirm('Turn off biometric unlock on this device?')) {
      return;
    }
    disableBiometric(userId);
    setEnabled(false);
    setError(null);
    setMessage('Biometric unlock was turned off.');
  };

  const canToggle = supported && available && !pending;
  const summary = !supported || !available ? 'Unavailable' : enabled ? 'On' : 'Off';

  return (
    <ProfileSection
      id="lock"
      icon={<Fingerprint size={16} />}
      title="Screen lock"
      summary={summary}
    >
      <div className="biometric-settings">
        <p className="privacy-hint">
          After sign-in, lock the app on this device and unlock with Face ID,
          fingerprint, or Windows Hello. Your session stays; only the screen is
          protected.
        </p>

        <div className="biometric-settings__row">
          <div className="biometric-settings__copy">
            <span id="biometric-toggle-label" className="biometric-settings__label">
              Unlock with biometrics
            </span>
            <span className="biometric-settings__status">Status: {statusLabel}</span>
          </div>
          <ProfileSwitch
            checked={enabled}
            disabled={!canToggle && !enabled}
            labelledBy="biometric-toggle-label"
            onChange={(checked) => {
              if (checked) {
                void onEnable();
              } else {
                onDisable();
              }
            }}
          />
        </div>

        {error ? (
          <p role="alert" className="privacy-error">
            {error}
          </p>
        ) : null}
        {message ? <p className="privacy-hint">{message}</p> : null}
      </div>
    </ProfileSection>
  );
};

export default BiometricSettings;
