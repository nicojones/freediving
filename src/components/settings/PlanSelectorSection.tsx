'use client';

import { useState } from 'react';
import type { PlanWithMeta } from '../../types/plan';
import { BUNDLED_PLAN_IDS } from '../../constants/app';
import { ConfirmPlanModal } from './ConfirmPlanModal';
import { ConfirmResetModal } from './ConfirmResetModal';
import { PlanCard } from './PlanCard';

interface PlanSelectorSectionProps {
  availablePlans: PlanWithMeta[];
  activePlanId: string | null;
  currentUserId: number | undefined;
  onPlanChange: (planId: string) => void;
  onPlanDeleted: () => void;
  onPlanEdited?: () => void;
  planProgress?: Record<string, { completed: number; total: number }>;
}

export const PlanSelectorSection = ({
  availablePlans,
  activePlanId,
  currentUserId,
  onPlanChange,
  onPlanDeleted,
  onPlanEdited,
  planProgress = {},
}: PlanSelectorSectionProps) => {
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [editingPlan, setEditingPlan] = useState<PlanWithMeta | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const otherPlans = availablePlans.filter((p) => p.id !== activePlanId);

  const isUserCreated = (p: PlanWithMeta) =>
    !BUNDLED_PLAN_IDS.includes(p.id) &&
    (p.created_by === currentUserId || p.created_by === undefined);

  const handleRequestDelete = (e: React.MouseEvent, planId: string, planName: string) => {
    e.stopPropagation();
    setPendingDelete({ id: planId, name: planName });
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }
    setError(null);
    setDeletingPlanId(pendingDelete.id);
    try {
      const res = await fetch(`/api/plans/${encodeURIComponent(pendingDelete.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? `Failed to delete (${res.status})`);
        return;
      }
      onPlanDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setDeletingPlanId(null);
      setPendingDelete(null);
    }
  };

  const handleRequestEdit = (e: React.MouseEvent, plan: PlanWithMeta) => {
    e.stopPropagation();
    setEditingPlan(plan);
  };

  const handleConfirmEdit = async (name: string, description: string) => {
    if (!editingPlan) {
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/plans/${encodeURIComponent(editingPlan.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
        credentials: 'include',
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? `Failed to update plan (${res.status})`);
        return;
      }
      setEditingPlan(null);
      await onPlanEdited?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    }
  };

  return (
    <div className="bg-surface-container-low rounded-3xl p-6 mb-6 overflow-hidden border border-outline-variant/30">
      <h2 className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">
        Other Training plans
      </h2>
      {error && (
        <div className="mb-3 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-body">
          {error}
        </div>
      )}
      <div
        data-testid="plan-selector"
        className="rounded-xl border border-outline-variant/60 bg-surface-container-low/50"
      >
        {otherPlans.length === 0 ? (
          <p
            className="px-5 py-8 text-on-surface-variant text-sm font-body text-center"
            data-testid="plan-selector-empty"
          >
            Nothing here
          </p>
        ) : (
          otherPlans.map((p) => {
            const showMenu = isUserCreated(p);
            const showPublicIcon = !isUserCreated(p) && p.public === true;
            const deleteDisabled = deletingPlanId === p.id;
            const progress = planProgress[p.id];

            return (
              <PlanCard
                key={p.id}
                plan={p}
                progress={progress}
                variant="selectable"
                onClick={() => onPlanChange(p.id)}
                showMenu={showMenu}
                showPublicIcon={showPublicIcon}
                deleteDisabled={deleteDisabled}
                onRequestDelete={handleRequestDelete}
                onRequestEdit={handleRequestEdit}
                onCopyError={setError}
                dataTestId="plan-selector-option"
                progressTestId={`plan-progress-${p.id}`}
                creatorTestId="plan-creator"
              />
            );
          })
        )}
      </div>

      <ConfirmResetModal
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete plan"
        message={
          pendingDelete ? (
            <>
              This will permanently delete{' '}
              <strong className="text-on-surface">{pendingDelete.name}</strong>. Type{' '}
              <strong className="text-on-surface">delete</strong> to confirm.
            </>
          ) : (
            ''
          )
        }
        confirmWord="delete"
      />

      {editingPlan && (
        <ConfirmPlanModal
          isOpen={editingPlan !== null}
          onClose={() => setEditingPlan(null)}
          plan={editingPlan}
          onConfirm={handleConfirmEdit}
          isEditMode
        />
      )}
    </div>
  );
};
