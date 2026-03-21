'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { TabPageLayout } from '@/src/components/layout/TabPageLayout';
import { CreatePlanSection } from '@/src/components/settings/CreatePlanSection';
import { useTraining } from '@/src/hooks/useTraining';
import { fetchPlansFromApi } from '@/src/services/planService';
import type { PlanWithMeta } from '@/src/types/plan';

export function CreatePlanView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editPlanId = searchParams?.get('edit');
  const { availablePlans, refreshAvailablePlans } = useTraining();
  const [editPlan, setEditPlan] = useState<PlanWithMeta | null | undefined>(undefined);

  useEffect(() => {
    if (!editPlanId) {
      setEditPlan(null);
      return;
    }
    const fromContext = availablePlans.find((p) => p.id === editPlanId);
    if (fromContext) {
      setEditPlan(fromContext);
      return;
    }
    let cancelled = false;
    fetchPlansFromApi().then((plans) => {
      if (cancelled) {
        return;
      }
      const found = plans.find((p) => p.id === editPlanId);
      setEditPlan(found ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [editPlanId, availablePlans]);

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
        initialDraftPlan={editPlan ?? undefined}
      />
    </TabPageLayout>
  );
}
