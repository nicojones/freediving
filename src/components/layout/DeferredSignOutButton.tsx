'use client';

import { useState, useEffect } from 'react';

interface DeferredSignOutButtonProps {
  onSignOut: () => void;
  delayMs?: number;
}

export const DeferredSignOutButton = ({
  onSignOut,
  delayMs = 5000,
}: DeferredSignOutButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe pt-4 flex justify-center bg-background/80 backdrop-blur-sm">
      <button
        type="button"
        onClick={onSignOut}
        className="text-primary font-label hover:underline text-sm"
      >
        Sign out
      </button>
    </div>
  );
};
