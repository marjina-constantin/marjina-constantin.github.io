import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface KeyBoxProps {
  value: string;
  onCopied?: () => void;
}

/** Shows a key with a Copy button. Manually copying the text counts as copied too. */
const KeyBox = ({ value, onCopied }: KeyBoxProps) => {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const markCopied = () => {
    setCopied(true);
    setCopyFailed(false);
    onCopied?.();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      markCopied();
    } catch {
      setCopyFailed(true);
    }
  };

  return (
    <div className="privacy-key">
      <code
        className="privacy-key__value"
        onCopy={markCopied}
        onClick={(event) => window.getSelection()?.selectAllChildren(event.currentTarget)}
      >
        {value}
      </code>
      <button type="button" className="button-secondary privacy-key__copy" onClick={handleCopy}>
        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
      </button>
      {copyFailed && (
        <p className="privacy-hint">Couldn&apos;t copy automatically. Tap the key to select it and copy it.</p>
      )}
    </div>
  );
};

export default KeyBox;
