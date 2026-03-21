'use client';

import clsx from 'clsx';
import type { PlanWithMeta } from '../../../types/plan';
import { AIVoicePlanInput } from '../../../features/ai-plan';
import { CREATE_PLAN_BTN_PRIMARY, CREATE_PLAN_BTN_SECONDARY, CREATE_PLAN_TEXTAREA } from './styles';

interface CreatePlanDraftPreviewProps {
  refineText: string;
  setRefineText: (v: string) => void;
  isRefining: boolean;
  loading: boolean;
  draftPlan: PlanWithMeta | null;
  voiceActive: boolean;
  onRefine: () => void;
  onResetDraft: () => void;
  onOpenPreview: () => void;
  onOpenConfirm: () => void;
  onClearError: () => void;
  onVoiceRefineResult: (json: string) => void;
  onRecordingChange: (recording: boolean) => void;
  onVoiceSubmittingChange: (v: boolean) => void;
  getAbortSignal: () => AbortSignal;
  previewJustUpdated?: boolean;
  isEditMode?: boolean;
}

export function CreatePlanDraftPreview({
  refineText,
  setRefineText,
  isRefining,
  loading,
  draftPlan,
  voiceActive,
  onRefine,
  onResetDraft,
  onOpenPreview,
  onOpenConfirm,
  onClearError,
  onVoiceRefineResult,
  onRecordingChange,
  onVoiceSubmittingChange,
  getAbortSignal,
  previewJustUpdated,
  isEditMode,
}: CreatePlanDraftPreviewProps) {
  const textDisabled = isRefining || voiceActive;
  const voiceDisabled = isRefining;
  return (
    <div className="space-y-6" data-testid="create-plan-preview">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onOpenPreview}
          className={clsx(
            'h-12 px-6 rounded-xl border-2 border-primary bg-primary/20 hover:bg-primary/30 font-headline font-bold text-primary text-base flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]',
            previewJustUpdated &&
              'animate-pulse ring-2 ring-success ring-offset-0 border-success! shadow-success shadow-lg'
          )}
          data-testid="create-plan-preview-button"
        >
          <span className="material-symbols-outlined text-xl" aria-hidden>
            visibility
          </span>
          Preview plan
        </button>
        {!isEditMode && (
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
        )}
      </div>
      {!isEditMode && (
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
            disabled={textDisabled}
            placeholder="Change X to Y..."
            className={clsx(CREATE_PLAN_TEXTAREA, 'h-24')}
            aria-label="Refine plan"
            data-testid="create-plan-refine-textarea"
          />
          <button
            type="button"
            onClick={onRefine}
            disabled={!refineText.trim() || textDisabled}
            className={clsx(CREATE_PLAN_BTN_SECONDARY, 'w-full')}
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
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-outline-variant/40" />
            <span className="text-on-surface-variant/70 font-body text-sm">or</span>
            <div className="flex-1 h-px bg-outline-variant/40" />
          </div>
          <AIVoicePlanInput
            onResult={onVoiceRefineResult}
            disabled={isRefining}
            onRecordingChange={onRecordingChange}
            onVoiceSubmittingChange={onVoiceSubmittingChange}
            getAbortSignal={getAbortSignal}
            contextPlan={draftPlan ?? undefined}
          />
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-outline-variant/40" />
            <span className="text-on-surface-variant/70 font-body text-sm">then</span>
            <div className="flex-1 h-px bg-outline-variant/40" />
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onOpenConfirm}
        disabled={loading || textDisabled || voiceDisabled}
        className={clsx(CREATE_PLAN_BTN_PRIMARY, 'w-full')}
        data-testid="create-plan-confirm-button"
      >
        {loading ? (
          <span className="material-symbols-outlined animate-spin text-xl" aria-hidden>
            progress_activity
          </span>
        ) : isEditMode ? (
          'Save'
        ) : (
          'Confirm'
        )}
      </button>
    </div>
  );
}
