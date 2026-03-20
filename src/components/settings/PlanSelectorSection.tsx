import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import type { PlanWithMeta } from '../../types/plan';

interface PlanSelectorSectionProps {
  availablePlans: PlanWithMeta[];
  activePlanId: string | null;
  onPlanChange: (planId: string) => void;
}

export function PlanSelectorSection({
  availablePlans,
  activePlanId,
  onPlanChange,
}: PlanSelectorSectionProps) {
  const selectedPlan = availablePlans.find((p) => p.id === activePlanId);

  return (
    <div className="bg-surface-container-low rounded-3xl p-6 mb-6 overflow-hidden border border-outline-variant/30">
      <h2 className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">
        Training plan
      </h2>
      <Listbox value={activePlanId ?? ''} onChange={onPlanChange}>
        <ListboxButton
          data-testid="plan-selector"
          className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant/60 bg-surface-container-low/50 text-on-surface font-body text-base focus:border-primary focus:outline-none text-left"
          aria-label="Select training plan"
        >
          {selectedPlan?.name ?? 'Select plan'}
        </ListboxButton>
        <ListboxOptions
          anchor="bottom"
          className="mt-1 max-h-60 w-[var(--button-width)] overflow-auto rounded-xl border border-outline-variant/60 bg-surface-container-low shadow-xl"
        >
          {availablePlans.map((p) => (
            <ListboxOption
              key={p.id}
              value={p.id}
              data-testid="plan-selector-option"
              data-testid-value={p.id}
              className="px-4 py-3 cursor-pointer data-active:bg-surface-container-high data-selected:bg-surface-container-high text-on-surface font-body text-base"
            >
              {p.name}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
    </div>
  );
}
