'use client';

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { PlanWithMeta } from '../../types/plan';
import { getPhasesForDay, getDaySummary } from '../../services/planService';
import { SessionBreakdown } from '../session/SessionBreakdown';

interface PlanPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanWithMeta;
}

export function PlanPreviewModal({ isOpen, onClose, plan }: PlanPreviewModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 flex items-center justify-center p-4 bg-black/60"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-surface-container-low rounded-3xl p-6 max-w-lg w-full max-h-[85vh] flex flex-col border border-outline-variant/30 shadow-xl">
          <DialogTitle
            id="plan-preview-title"
            className="font-headline text-xl font-bold text-on-surface mb-1 shrink-0"
          >
            {plan.name ?? 'Untitled'}
          </DialogTitle>
          {plan.description && (
            <p className="text-on-surface-variant font-body text-sm mb-4 shrink-0">
              {plan.description}
            </p>
          )}
          <div
            className="overflow-y-auto flex-1 min-h-0 space-y-6 pr-2"
            data-testid="plan-preview-content"
          >
            {plan.days.map((_, dayIndex) => {
              const phases = getPhasesForDay(plan.days, dayIndex);
              const summary = getDaySummary(plan.days, dayIndex);
              return (
                <div
                  key={dayIndex}
                  className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 p-4"
                >
                  <h4 className="font-headline font-bold text-on-surface mb-3">
                    Day {dayIndex + 1}
                    {summary && (
                      <span className="font-body font-normal text-on-surface-variant ml-2">
                        — {summary}
                      </span>
                    )}
                  </h4>
                  {phases ? (
                    <SessionBreakdown phases={phases} />
                  ) : (
                    <p className="text-on-surface-variant font-body text-sm">Rest day</p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="shrink-0 pt-4 mt-4 border-t border-outline-variant/30">
            <button
              type="button"
              onClick={onClose}
              className="w-full h-12 rounded-xl border-2 border-outline-variant/60 bg-surface-container-low/50 hover:bg-surface-container-low font-headline font-bold text-on-surface text-base transition-all duration-300 active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
