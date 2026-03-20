'use client';

import clsx from 'clsx';
import { CREATE_PLAN_BTN_PRIMARY, CREATE_PLAN_BTN_SECONDARY, CREATE_PLAN_TEXTAREA } from './styles';

interface CreatePlanDraftPreviewProps {
  refineText: string;
  setRefineText: (v: string) => void;
  isRefining: boolean;
  loading: boolean;
  onRefine: () => void;
  onResetDraft: () => void;
  onOpenPreview: () => void;
  onOpenConfirm: () => void;
  onClearError: () => void;
}

export function CreatePlanDraftPreview({
  refineText,
  setRefineText,
  isRefining,
  loading,
  onRefine,
  onResetDraft,
  onOpenPreview,
  onOpenConfirm,
  onClearError,
}: CreatePlanDraftPreviewProps) {
  return (
    <div className="space-y-6" data-testid="create-plan-preview">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onOpenPreview}
          className="h-12 px-6 rounded-xl border-2 border-primary bg-primary/20 hover:bg-primary/30 font-headline font-bold text-primary text-base flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]"
          data-testid="create-plan-preview-button"
        >
          <span className="material-symbols-outlined text-xl" aria-hidden>
            visibility
          </span>
          Preview plan
        </button>
        <button
          type="button"
          onClick={onResetDraft}
          className="h-12 px-4 rounded-xl border-2 border-outline-variant/50 bg-surface-container-low font-headline font-bold border-dashed text-sm shrink-0 flex items-center gap-1 transition-all duration-300 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-base" aria-hidden>
            restart_alt
          </span>
          Start over
        </button>
      </div>
      <div className="flex flex-col gap-y-4">
        <span className="text-outline-variant text-sm">
          If you're not happy with the plan, explain your changes below...
        </span>
        <textarea
          value={refineText}
          onChange={(e) => {
            setRefineText(e.target.value);
            onClearError();
          }}
          placeholder="Change X to Y..."
          className={clsx(CREATE_PLAN_TEXTAREA, 'h-24')}
          aria-label="Refine plan"
          data-testid="create-plan-refine-textarea"
        />
        <div className="flex gap-3 mt-0">
          <button
            type="button"
            onClick={onRefine}
            disabled={!refineText.trim() || isRefining}
            className={clsx(CREATE_PLAN_BTN_SECONDARY, 'flex-1')}
            data-testid="create-plan-refine-button"
          >
            {isRefining ? (
              <span className="material-symbols-outlined animate-spin text-xl" aria-hidden>
                progress_activity
              </span>
            ) : (
              'Refine'
            )}
          </button>
          <button
            type="button"
            onClick={onOpenConfirm}
            disabled={loading}
            className={clsx(CREATE_PLAN_BTN_PRIMARY, 'flex-1')}
            data-testid="create-plan-confirm-button"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-xl" aria-hidden>
                progress_activity
              </span>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
