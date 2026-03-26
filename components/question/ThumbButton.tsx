'use client';

import { useState, useCallback, useEffect } from 'react';
import { addThumb } from '@/lib/api/thumbs';

interface ThumbButtonProps {
  questionId: string;
  thumbCount: number;
  onThumbAdded?: (questionId: string) => void;
}

function getThumbedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = sessionStorage.getItem('askly-thumbed');
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

function saveThumbedId(id: string) {
  if (typeof window === 'undefined') return;
  const ids = getThumbedIds();
  ids.add(id);
  sessionStorage.setItem('askly-thumbed', JSON.stringify(Array.from(ids)));
}

export default function ThumbButton({
  questionId,
  thumbCount,
  onThumbAdded,
}: ThumbButtonProps) {
  const [count, setCount] = useState(thumbCount);
  const [hasThumbed, setHasThumbed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setHasThumbed(getThumbedIds().has(questionId));
  }, [questionId]);

  useEffect(() => {
    setCount(thumbCount);
  }, [thumbCount]);

  const handleClick = useCallback(async () => {
    if (hasThumbed || loading) return;

    // Optimistic update
    setCount((c) => c + 1);
    setHasThumbed(true);
    setLoading(true);

    try {
      await addThumb(questionId);
      saveThumbedId(questionId);
      onThumbAdded?.(questionId);
    } catch {
      // Revert on error
      setCount((c) => c - 1);
      setHasThumbed(false);
    } finally {
      setLoading(false);
    }
  }, [questionId, hasThumbed, loading, onThumbAdded]);

  return (
    <button
      onClick={handleClick}
      disabled={hasThumbed || loading}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
        transition-colors
        ${
          hasThumbed
            ? 'bg-blue-100 text-blue-600 cursor-default'
            : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
        }
        disabled:cursor-not-allowed
      `}
    >
      <span className="text-base">👍</span>
      <span>{count}</span>
    </button>
  );
}
