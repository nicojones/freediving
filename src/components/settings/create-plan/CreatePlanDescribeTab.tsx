'use client';

import type { PlanWithMeta } from '../../../types/plan';
import { CreatePlanDraftPreview } from './CreatePlanDraftPreview';
import { CreatePlanDescribeInput } from './CreatePlanDescribeInput';

interface CreatePlanDescribeTabProps {
  describeText: string;
  setDescribeText: (v: string) => void;
  draftPlan: PlanWithMeta | null;
  refineText: string;
  setRefineText: (v: string) => void;
  isCreatingDraft: boolean;
  isRefining: boolean;
  loading: boolean;
  recording: boolean;
  voiceSubmitting: boolean;
  setVoiceSubmitting: (v: boolean) => void;
  getAbortSignal: () => AbortSignal;
  onCreateDraft: () => void;
  onRefine: () => void;
  onResetDraft: () => void;
  onOpenPreview: () => void;
  onOpenConfirm: () => void;
  onRecordingChange: (recording: boolean) => void;
  onVoiceResult: (json: string) => void;
  onVoiceRefineResult: (json: string) => void;
  onClearError: () => void;
  previewJustUpdated?: boolean;
}

export function CreatePlanDescribeTab(props: CreatePlanDescribeTabProps) {
  const voiceActive = props.recording || props.voiceSubmitting;

  if (props.draftPlan) {
    return (
      <CreatePlanDraftPreview
        refineText={props.refineText}
        setRefineText={props.setRefineText}
        isRefining={props.isRefining}
        loading={props.loading}
        draftPlan={props.draftPlan}
        voiceActive={voiceActive}
        onRefine={props.onRefine}
        onResetDraft={props.onResetDraft}
        onOpenPreview={props.onOpenPreview}
        onOpenConfirm={props.onOpenConfirm}
        onClearError={props.onClearError}
        onVoiceRefineResult={props.onVoiceRefineResult}
        onRecordingChange={props.onRecordingChange}
        onVoiceSubmittingChange={props.setVoiceSubmitting}
        getAbortSignal={props.getAbortSignal}
        previewJustUpdated={props.previewJustUpdated}
      />
    );
  }

  return (
    <CreatePlanDescribeInput
      describeText={props.describeText}
      setDescribeText={props.setDescribeText}
      isCreatingDraft={props.isCreatingDraft}
      voiceActive={voiceActive}
      onCreateDraft={props.onCreateDraft}
      onRecordingChange={props.onRecordingChange}
      onVoiceResult={props.onVoiceResult}
      onVoiceSubmittingChange={props.setVoiceSubmitting}
      getAbortSignal={props.getAbortSignal}
      onClearError={props.onClearError}
    />
  );
}
