'use client'
import { useDevMode } from '../../hooks/useDevMode'

export function DevModeSection() {
  const [devModeEnabled, setDevModeEnabled] = useDevMode()

  return (
    <div
      className="bg-surface-container-low rounded-3xl p-6 mb-6 overflow-hidden border border-outline-variant/30"
      data-testid="dev-mode-section"
    >
      <h2 className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">
        Developer
      </h2>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={devModeEnabled}
          onChange={(e) => setDevModeEnabled(e.target.checked)}
          className="rounded border-outline-variant bg-surface-container-low"
          data-testid="dev-mode-toggle"
        />
        <span className="text-on-surface-variant font-body text-sm">
          Show test controls on session preview for faster testing
        </span>
      </label>
    </div>
  )
}
