'use client'

import { useState } from 'react'
import type { PlanWithMeta } from '@/src/types/plan'
import { BUNDLED_PLAN_IDS } from '@/src/constants/app'
import { ConfirmResetModal } from './ConfirmResetModal'

interface PlanDeleteSectionProps {
  plans: PlanWithMeta[]
  activePlanId: string | null
  currentUserId: number | undefined
  onPlanDeleted: () => void
}

export function PlanDeleteSection({
  plans,
  activePlanId,
  currentUserId,
  onPlanDeleted,
}: PlanDeleteSectionProps) {
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)

  // Deletable: DB plans (not bundled) that are not active. Include plans with created_by null (pre-migration).
  const deletablePlans = plans.filter(
    (p) =>
      !BUNDLED_PLAN_IDS.includes(p.id) &&
      p.id !== activePlanId &&
      (p.created_by === currentUserId || p.created_by === undefined)
  )

  if (deletablePlans.length === 0) {
    return null
  }

  const handleDelete = async (planId: string) => {
    setError(null)
    setDeletingPlanId(planId)
    try {
      const res = await fetch(`/api/plans/${encodeURIComponent(planId)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? `Failed to delete (${res.status})`)
        return
      }
      setDeletingPlanId(null)
      onPlanDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setDeletingPlanId(null)
    }
  }

  const handleRequestDelete = (planId: string, planName: string) => {
    setPendingDelete({ id: planId, name: planName })
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) {return}
    await handleDelete(pendingDelete.id)
    setPendingDelete(null)
  }

  return (
    <div className="bg-surface-container-low rounded-3xl p-6 mb-6 overflow-hidden border border-outline-variant/30">
      <h2 className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">
        Your plans
      </h2>
      <p className="text-on-surface-variant font-body text-sm mb-4">
        Plans you created can be permanently deleted when they are not active.
      </p>
      {error && (
        <div className="mb-3 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-body">
          {error}
        </div>
      )}
      <ul className="space-y-2">
        {deletablePlans.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 py-2 border-b border-outline-variant/20 last:border-0"
          >
            <span className="font-body text-on-surface truncate">{p.name}</span>
            <button
              type="button"
              onClick={() => handleRequestDelete(p.id, p.name)}
              disabled={deletingPlanId === p.id}
              className="shrink-0 h-10 px-4 rounded-xl border-2 border-error/50 bg-error/10 hover:bg-error/20 font-headline font-bold text-error text-sm flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid={`delete-plan-${p.id}`}
              aria-label={`Delete plan ${p.name}`}
            >
              {deletingPlanId === p.id ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg" aria-hidden>
                    progress_activity
                  </span>
                  Deleting…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg" aria-hidden>
                    delete
                  </span>
                  Delete
                </>
              )}
            </button>
          </li>
        ))}
      </ul>

      <ConfirmResetModal
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete plan"
        message={
          pendingDelete ? (
            <>
              This will permanently delete <strong className="text-on-surface">{pendingDelete.name}</strong>. Type <strong className="text-on-surface">delete</strong> to confirm.
            </>
          ) : (
            ''
          )
        }
        confirmWord="delete"
      />
    </div>
  )
}
