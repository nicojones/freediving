'use client';
import { Switch } from '@headlessui/react';
import { useDevMode } from '../../hooks/useDevMode';

export function DevModeSection() {
  const [devModeEnabled, setDevModeEnabled] = useDevMode();

  return (
    <div
      className="bg-surface-container-low/50 rounded-3xl p-6 overflow-hidden border border-outline-variant/20 flex flex-col gap-y-3"
      data-testid="dev-mode-section"
    >
      <h2 className="font-label text-[9px] uppercase tracking-[0.2em] text-on-surface-variant/70">
        Developer
      </h2>
      <label className="flex items-center gap-3 cursor-pointer">
        <Switch
          checked={devModeEnabled}
          onChange={setDevModeEnabled}
          data-testid="dev-mode-toggle"
          className="group inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-outline-variant/60 bg-surface-container-high transition data-checked:bg-primary data-checked:border-primary"
        >
          <span className="size-4 translate-x-1 rounded-full bg-white transition group-data-checked:translate-x-6" />
        </Switch>
        <span className="text-on-surface-variant font-body text-sm">
          Show test controls on session preview for faster testing
        </span>
      </label>
    </div>
  );
}
