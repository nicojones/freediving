'use client';

import { useRouter } from 'next/navigation';
import { TabPageLayout } from '@/src/components/layout/TabPageLayout';
import { CreatePlanSection } from '@/src/components/settings/CreatePlanSection';
import { useTraining } from '@/src/hooks/useTraining';

export function CreatePlanView() {
  const router = useRouter();
  const { refreshAvailablePlans } = useTraining();

  return (
    <TabPageLayout
      title="Create"
      subheader="Describe your plan in natural language, paste JSON, or explain with voice."
      activeTab="create"
      onTrainingClick={() => router.push('/')}
      onPlansClick={() => router.push('/plans')}
      onCreateClick={() => {}}
      onSettingsClick={() => router.push('/settings')}
      data-testid="create-plan-view"
    >
      <CreatePlanSection
        onPlanCreated={refreshAvailablePlans}
        onNavigateToPlans={() => router.push('/plans')}
      />
    </TabPageLayout>
  );
}
