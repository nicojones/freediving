'use client';

import clsx from 'clsx';
import { AIVoicePlanInput } from '../../../features/ai-plan';
import { CREATE_PLAN_BTN_PRIMARY, CREATE_PLAN_TEXTAREA } from './styles';

interface CreatePlanDescribeInputProps {
  describeText: string;
  setDescribeText: (v: string) => void;
  isCreatingDraft: boolean;
  voiceActive: boolean;
  onCreateDraft: () => void;
  onRecordingChange: (recording: boolean) => void;
  onVoiceResult: (json: string) => void;
  onVoiceSubmittingChange: (v: boolean) => void;
  getAbortSignal: () => AbortSignal;
  onClearError: () => void;
}

export const CreatePlanDescribeInput = ({
  describeText,
  setDescribeText,
  isCreatingDraft,
  voiceActive,
  onCreateDraft,
  onRecordingChange,
  onVoiceResult,
  onVoiceSubmittingChange,
  getAbortSignal,
  onClearError,
}: CreatePlanDescribeInputProps) => {
  const textDisabled = isCreatingDraft || voiceActive;
  return (
    <div className="space-y-4">
      <textarea
        value={describeText}
        onChange={(e) => {
          setDescribeText(e.target.value);
          onClearError();
        }}
        placeholder="Describe your plan (e.g. 3 days of holds, 2 min each, 2 min recovery)"
        className={clsx(CREATE_PLAN_TEXTAREA, 'h-40')}
        aria-label="Describe plan"
        data-testid="create-plan-describe-textarea"
        disabled={textDisabled}
      />
      <button
        type="button"
        onClick={onCreateDraft}
        disabled={!describeText.trim() || textDisabled}
        className={clsx(CREATE_PLAN_BTN_PRIMARY, 'w-full')}
        data-testid="create-plan-create-draft-button"
      >
        {isCreatingDraft ? (
          <>
            <span className="material-symbols-outlined animate-spin text-xl" aria-hidden>
              progress_activity
            </span>
            Creating…
          </>
        ) : !describeText.trim() ? (
          'Describe your plan first'
        ) : (
          <>
            <span className="material-symbols-outlined text-xl" aria-hidden>
              auto_awesome
            </span>
            Create draft
          </>
        )}
      </button>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-outline-variant/40" />
        <span className="text-on-surface-variant/70 font-body text-sm">or</span>
        <div className="flex-1 h-px bg-outline-variant/40" />
      </div>
      <AIVoicePlanInput
        onResult={onVoiceResult}
        disabled={isCreatingDraft}
        onRecordingChange={onRecordingChange}
        onVoiceSubmittingChange={onVoiceSubmittingChange}
        getAbortSignal={getAbortSignal}
      />
    </div>
  );
};
