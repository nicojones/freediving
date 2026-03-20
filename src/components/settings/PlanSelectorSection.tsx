import type { PlanWithMeta } from '../../types/plan'

interface PlanSelectorSectionProps {
  availablePlans: PlanWithMeta[]
  activePlanId: string | null
  onPlanChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

export function PlanSelectorSection({
  availablePlans,
  activePlanId,
  onPlanChange,
}: PlanSelectorSectionProps) {
  return (
    <div className="bg-surface-container-low rounded-3xl p-6 mb-6 overflow-hidden border border-outline-variant/30">
      <h2 className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">
        Training plan
      </h2>
      <select
        data-testid="plan-selector"
        value={activePlanId ?? ''}
        onChange={onPlanChange}
        className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant/60 bg-surface-container-low/50 text-on-surface font-body text-base focus:border-primary focus:outline-none"
        aria-label="Select training plan"
      >
        {availablePlans.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  )
}
