import React from 'react';

// Shared hashtag regex: matches # followed by word chars, spaces, and common special chars like /
// This handles multi-word tags like "#happy hour" or "#car service"
const HASHTAG_REGEX = /(#[a-zA-Z0-9\/]+(?:\s+[a-zA-Z0-9\/]+)*)/g;

interface HashtagTextProps {
  text: string;
}

/**
 * Renders text with hashtags styled as <span className="hashtag">.
 * Used by both TransactionList and IncomeList.
 */
const HashtagText: React.FC<HashtagTextProps> = ({ text }) => {
  if (!text) return null;

  const parts = text.split(HASHTAG_REGEX);

  return (
    <>
      {parts.map((part, index) =>
        part.startsWith('#') ? (
          <span key={index} className="hashtag">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
};

export default React.memo(HashtagText);
