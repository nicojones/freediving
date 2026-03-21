'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { PlanWithMeta } from '../../types/plan';
import { APP_NAME, BUNDLED_PLAN_IDS, CREATED_BY } from '../../constants/app';
import { ConfirmResetModal } from './ConfirmResetModal';

interface PlanSelectorSectionProps {
  availablePlans: PlanWithMeta[];
  activePlanId: string | null;
  currentUserId: number | undefined;
  onPlanChange: (planId: string) => void;
  onPlanDeleted: () => void;
  planProgress?: Record<string, { completed: number; total: number }>;
}

export function PlanSelectorSection({
  availablePlans,
  activePlanId,
  currentUserId,
  onPlanChange,
  onPlanDeleted,
  planProgress = {},
}: PlanSelectorSectionProps) {
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

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

  return (
    <div className="bg-surface-container-low rounded-3xl p-6 mb-6 overflow-hidden border border-outline-variant/30">
      <h2 className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">
        Training plan
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
        {availablePlans.map((p) => {
          const isActive = p.id === activePlanId;
          const showDelete = isUserCreated(p);
          const deleteDisabled = isActive || deletingPlanId === p.id;

          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => onPlanChange(p.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPlanChange(p.id);
                }
              }}
              data-testid="plan-selector-option"
              data-testid-value={p.id}
              data-plan-name={p.name}
              className={clsx(
                'w-full flex items-start justify-between gap-4 px-5 py-4 text-left border-b border-outline-variant/20 last:border-0 transition-colors cursor-pointer',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-surface-container-high text-on-surface'
              )}
            >
              <div className="flex justify-between items-start gap-4 min-w-0 flex-1">
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  {/* Top row: name | progress + creator */}
                  <div className="flex justify-between items-start flex-row-reverse gap-4">
                    {planProgress[p.id] && (
                      <span className="subtle" data-testid={`plan-progress-${p.id}`}>
                        {planProgress[p.id].completed}/{planProgress[p.id].total} days
                      </span>
                    )}
                    {p.public === true && (
                      <span className="subtle" data-testid="plan-creator">
                        {CREATED_BY} {p.creator_name ?? APP_NAME}
                      </span>
                    )}
                  </div>

                  {/* Rest of card details */}
                  <span className="font-body font-medium truncate min-w-0">{p.name}</span>
                  {(p.description || showDelete) && (
                    <div className="flex flex-row justify-between">
                      {p.description && (
                        <span className="text-on-surface-variant text-sm font-normal line-clamp-2">
                          {p.description}
                        </span>
                      )}
                      {showDelete && (
                        <button
                          type="button"
                          onClick={(e) => handleRequestDelete(e, p.id, p.name)}
                          disabled={deleteDisabled}
                          className="shrink-0 h-9 px-3 rounded-lg border-2 border-error/50 bg-error/10 hover:bg-error/20 font-headline font-bold text-error text-sm flex items-center justify-center gap-1.5 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-error/10"
                          data-testid={`delete-plan-${p.id}`}
                          aria-label={`Delete plan ${p.name}`}
                        >
                          {deletingPlanId === p.id ? (
                            <span
                              className="material-symbols-outlined animate-spin text-base"
                              aria-hidden
                            >
                              progress_activity
                            </span>
                          ) : (
                            <span className="material-symbols-outlined text-base" aria-hidden>
                              delete
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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
    </div>
  );
}
