'use client';

import type { PlanWithMeta } from '~/types/plan';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '~/components/ui/Tabs';
import { ConfirmPlanModal } from './ConfirmPlanModal';
import { PlanPreviewModal } from './PlanPreviewModal';
import clsx from 'clsx';
import { CreatePlanDescribeTab } from './create-plan/CreatePlanDescribeTab';
import { CreatePlanPasteTab } from './create-plan/CreatePlanPasteTab';
import { CreatePlanStatusBanner } from './create-plan/CreatePlanStatusBanner';
import { useCreatePlanHandlers } from './create-plan/useCreatePlanHandlers';

interface CreatePlanSectionProps {
  onPlanCreated?: () => void;
  onNavigateToPlans?: () => void;
  initialDraftPlan?: PlanWithMeta | null;
}

export function CreatePlanSection({
  onPlanCreated,
  onNavigateToPlans,
  initialDraftPlan,
}: CreatePlanSectionProps) {
  const handlers = useCreatePlanHandlers(onPlanCreated, initialDraftPlan ?? undefined);

  return (
    <div className="bg-surface-container-low rounded-3xl p-6 mb-6 overflow-hidden border border-outline-variant/30">
      <h2 className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">
        Create plan
      </h2>

      <TabGroup>
        <TabList className="flex gap-2 border-b border-outline-variant/30 mb-4">
          {(data) => (
            <>
              {['Describe', 'Paste / Raw'].map((tab, i) => (
                <Tab
                  key={tab}
                  data-testid={i === 0 ? 'create-plan-tab-describe' : 'create-plan-tab-paste'}
                  className={clsx(
                    'px-4 py-2 rounded-t-lg font-headline font-bold text-sm transition-colors',
                    data.selectedIndex === i
                      ? 'bg-surface-variant text-on-surface'
                      : 'bg-outline-variant/10 text-on-surface/20'
                  )}
                >
                  {tab}
                </Tab>
              ))}
            </>
          )}
        </TabList>

        <TabPanels>
          <TabPanel>
            <CreatePlanDescribeTab
              describeText={handlers.describeText}
              setDescribeText={handlers.setDescribeText}
              draftPlan={handlers.draftPlan}
              refineText={handlers.refineText}
              setRefineText={handlers.setRefineText}
              isCreatingDraft={handlers.isCreatingDraft}
              isRefining={handlers.isRefining}
              loading={handlers.loading}
              recording={handlers.recording}
              voiceSubmitting={handlers.voiceSubmitting}
              setVoiceSubmitting={handlers.setVoiceSubmitting}
              getAbortSignal={handlers.getAbortSignal}
              onCreateDraft={handlers.handleCreateDraft}
              onRefine={handlers.handleRefine}
              onResetDraft={handlers.resetDraftFlow}
              onOpenPreview={handlers.openPreview}
              onOpenConfirm={() => handlers.setConfirmModalOpen(true)}
              onRecordingChange={handlers.setRecording}
              onVoiceResult={handlers.handleVoiceResult}
              onVoiceRefineResult={handlers.handleVoiceRefineResult}
              onClearError={() => handlers.setError(null)}
              previewJustUpdated={handlers.previewJustUpdated}
              isEditMode={handlers.isEditMode}
            />
          </TabPanel>

          <TabPanel>
            <CreatePlanPasteTab
              jsonText={handlers.jsonText}
              setJsonText={handlers.setJsonText}
              loading={handlers.loading}
              fileInputRef={handlers.fileInputRef}
              onFileSelect={handlers.handleFileSelect}
              onPaste={handlers.handlePaste}
              onClear={() => {
                handlers.setJsonText('');
                handlers.setError(null);
              }}
              onCreate={handlers.handlePasteTabCreate}
              onClearError={() => handlers.setError(null)}
            />
          </TabPanel>
        </TabPanels>
      </TabGroup>

      <CreatePlanStatusBanner
        error={handlers.error}
        success={handlers.success}
        onNavigateToPlans={onNavigateToPlans}
      />

      {handlers.draftPlan && (
        <>
          <PlanPreviewModal
            isOpen={handlers.previewModalOpen}
            onClose={() => handlers.setPreviewModalOpen(false)}
            plan={handlers.draftPlan}
          />
          <ConfirmPlanModal
            isOpen={handlers.confirmModalOpen}
            onClose={() => handlers.setConfirmModalOpen(false)}
            plan={handlers.draftPlan}
            onConfirm={handlers.handleConfirmPlan}
            isEditMode={handlers.isEditMode}
          />
        </>
      )}
    </div>
  );
}
