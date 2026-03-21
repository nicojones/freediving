'use client';

import { useRouter } from 'next/navigation';
import { TopAppBar } from '@/src/components/layout/TopAppBar';
import { BottomNavBar } from '@/src/components/layout/BottomNavBar';
import { CreatePlanSection } from '@/src/components/settings/CreatePlanSection';
import { useTraining } from '@/src/hooks/useTraining';

export function CreatePlanView() {
  const router = useRouter();
  const { refreshAvailablePlans } = useTraining();

  return (
    <div
      className="min-h-screen bg-background pb-32 min-w-0 overflow-x-hidden"
      data-testid="create-plan-view"
    >
      <TopAppBar variant="dashboard" />
      <main
        className="px-6 pt-8 max-w-2xl mx-auto rounded-3xl transition-all duration-300"
        style={{
          background:
            'linear-gradient(180deg, rgba(82, 218, 211, 0.05) 0%, rgba(13, 20, 22, 0) 100%)',
        }}
      >
        <CreatePlanSection
          onPlanCreated={refreshAvailablePlans}
          onNavigateToPlans={() => router.push('/plans')}
        />
      </main>
      <BottomNavBar
        activeTab="create"
        onTrainingClick={() => router.push('/')}
        onPlansClick={() => router.push('/plans')}
        onCreateClick={() => {}}
        onSettingsClick={() => router.push('/settings')}
      />
    </div>
  );
}
