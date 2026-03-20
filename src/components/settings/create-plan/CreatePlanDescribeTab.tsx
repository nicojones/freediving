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
  onCreateDraft: () => void;
  onRefine: () => void;
  onResetDraft: () => void;
  onOpenPreview: () => void;
  onOpenConfirm: () => void;
  onRecordingChange: (recording: boolean) => void;
  onVoiceResult: (json: string) => void;
  onClearError: () => void;
}

export function CreatePlanDescribeTab(props: CreatePlanDescribeTabProps) {
  if (props.draftPlan) {
    return (
      <CreatePlanDraftPreview
        refineText={props.refineText}
        setRefineText={props.setRefineText}
        isRefining={props.isRefining}
        loading={props.loading}
        onRefine={props.onRefine}
        onResetDraft={props.onResetDraft}
        onOpenPreview={props.onOpenPreview}
        onOpenConfirm={props.onOpenConfirm}
        onClearError={props.onClearError}
      />
    );
  }

  return (
    <CreatePlanDescribeInput
      describeText={props.describeText}
      setDescribeText={props.setDescribeText}
      isCreatingDraft={props.isCreatingDraft}
      recording={props.recording}
      onCreateDraft={props.onCreateDraft}
      onRecordingChange={props.onRecordingChange}
      onVoiceResult={props.onVoiceResult}
      onClearError={props.onClearError}
    />
  );
}
