'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { PlanWithMeta } from '../../types/plan';

interface ConfirmPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanWithMeta;
  onConfirm: (name: string, description: string) => void | Promise<void>;
  isEditMode?: boolean;
}

export function ConfirmPlanModal({
  isOpen,
  onClose,
  plan,
  onConfirm,
  isEditMode,
}: ConfirmPlanModalProps) {
  const [name, setName] = useState(plan.name ?? '');
  const [description, setDescription] = useState(plan.description ?? '');

  useEffect(() => {
    if (isOpen) {
      setName(plan.name ?? '');
      setDescription(plan.description ?? '');
    }
  }, [isOpen, plan.name, plan.description]);

  const handleConfirm = async () => {
    onClose();
    await onConfirm(name, description);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 flex items-center justify-center p-4 bg-black/60"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className="bg-surface-container-low rounded-3xl p-6 max-w-md w-full border border-outline-variant/30 shadow-xl"
          data-testid="confirm-plan-modal"
        >
          <DialogTitle
            id="confirm-plan-title"
            className="font-headline text-xl font-bold text-on-surface mb-2"
          >
            Save plan
          </DialogTitle>
          <p className="text-on-surface-variant font-body text-sm mb-4">
            You can edit the plan name and description below.
          </p>
          <input
            type="text"
            data-testid="confirm-plan-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Plan name"
            className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant/60 bg-surface-container-low/50 text-on-surface font-body text-base focus:border-primary focus:outline-none mb-3"
            aria-label="Plan name"
            autoComplete="off"
          />
          <textarea
            data-testid="confirm-plan-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Plan description (optional)"
            rows={2}
            className="w-full min-h-48 px-4 py-3 rounded-xl border-2 border-outline-variant/60 bg-surface-container-low/50 text-on-surface font-body text-base focus:border-primary focus:outline-none mb-4 resize-vertical"
            aria-label="Plan description"
            autoComplete="off"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border-2 border-outline-variant/60 bg-surface-container-low/50 hover:bg-surface-container-low font-headline font-bold text-on-surface text-base transition-all duration-300 active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="confirm-plan-submit"
              onClick={handleConfirm}
              className="flex-1 h-12 rounded-xl border-2 border-primary bg-primary/20 hover:bg-primary/30 font-headline font-bold text-primary text-base transition-all duration-300 active:scale-[0.98]"
            >
              {isEditMode ? 'Save' : 'Create'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
