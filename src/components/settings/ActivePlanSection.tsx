'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PlanWithMeta } from '../../types/plan';
import { BUNDLED_PLAN_IDS } from '../../constants/app';
import { ConfirmPlanModal } from './ConfirmPlanModal';
import { PlanCard } from './PlanCard';

interface ActivePlanSectionProps {
  plan: PlanWithMeta | null;
  progress?: { completed: number; total: number };
  currentUserId?: number;
  onPlanEdited?: () => void;
}

export const ActivePlanSection = ({
  plan,
  progress,
  currentUserId,
  onPlanEdited,
}: ActivePlanSectionProps) => {
  const router = useRouter();
  const [editingPlan, setEditingPlan] = useState<PlanWithMeta | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  if (!plan) {
    return null;
  }

  const isUserCreated =
    !BUNDLED_PLAN_IDS.includes(plan.id) &&
    (plan.created_by === currentUserId || plan.created_by === undefined);
  const showMenu = isUserCreated;
  const showPublicIcon = !isUserCreated && plan.public === true;

  const handleRequestEdit = (e: React.MouseEvent, p: PlanWithMeta) => {
    e.stopPropagation();
    setEditingPlan(p);
  };

  const handleConfirmEdit = async (name: string, description: string) => {
    if (!editingPlan) {
      return;
    }
    setEditError(null);
    try {
      const res = await fetch(`/api/plans/${encodeURIComponent(editingPlan.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
        credentials: 'include',
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setEditError(data.error ?? `Failed to update plan (${res.status})`);
        return;
      }
      setEditingPlan(null);
      await onPlanEdited?.();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Network error');
    }
  };

  return (
    <div
      className="bg-surface-container-low rounded-3xl p-6 mb-6 overflow-hidden border border-outline-variant/30"
      data-testid="active-plan-section"
    >
      <h2 className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">
        Active plan
      </h2>
      {editError && (
        <div className="mb-3 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-body">
          {editError}
        </div>
      )}
      <PlanCard
        plan={plan}
        progress={progress}
        variant="active"
        onClick={() => router.push('/')}
        showMenu={showMenu}
        showPublicIcon={showPublicIcon}
        deleteDisabled
        onRequestDelete={() => {}}
        onRequestEdit={handleRequestEdit}
        dataTestId="active-plan-box"
        progressTestId="active-plan-progress"
        creatorTestId="active-plan-creator"
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
