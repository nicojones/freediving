'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TabPageLayout } from '@/src/components/layout/TabPageLayout';
import { PlanSelectorSection } from '@/src/components/settings/PlanSelectorSection';
import { ConfirmSwitchPlanModal } from '@/src/components/settings/ConfirmSwitchPlanModal';
import { useTraining } from '@/src/hooks/useTraining';
import { fetchCompletions } from '@/src/services/progressService';

/**
 * Plans tab: change plan, add plan, delete plan (user-created, non-active).
 *
 * Future enhancement: explore plans without switching active plan.
 * Structure (plan list with select + delete) leaves room for adding
 * a "preview/explore" mode — user could browse plan details without changing
 * their active plan. Do not implement; only ensure no dead ends block this.
 */
export function PlansView() {
  const router = useRouter();
  const { user, availablePlans, activePlanId, setActivePlan, refreshAvailablePlans } =
    useTraining();

  const [confirmPlanChange, setConfirmPlanChange] = useState<{
    pendingPlanId: string;
  } | null>(null);

  const [planProgress, setPlanProgress] = useState<
    Record<string, { completed: number; total: number }>
  >({});

  const refreshPlanProgress = useCallback(async () => {
    if (!user || availablePlans.length === 0) {
      return;
    }
    const results = await Promise.all(
      availablePlans.map(async (p) => {
        const c = await fetchCompletions(p.id);
        return { id: p.id, completed: c.length, total: p.days.length };
      })
    );
    const record: Record<string, { completed: number; total: number }> = {};
    for (const r of results) {
      record[r.id] = { completed: r.completed, total: r.total };
    }
    setPlanProgress(record);
  }, [user, availablePlans]);

  useEffect(() => {
    refreshPlanProgress();
  }, [refreshPlanProgress]);

  const handlePlanChange = (planId: string) => {
    if (planId === activePlanId) {
      return;
    }
    setConfirmPlanChange({ pendingPlanId: planId });
  };

  const handleCloseConfirm = () => {
    setConfirmPlanChange(null);
  };

  const handleConfirmPlanChange = async () => {
    if (confirmPlanChange?.pendingPlanId) {
      await setActivePlan(confirmPlanChange.pendingPlanId);
      await refreshPlanProgress();
    }
    handleCloseConfirm();
  };

  const pendingPlan = confirmPlanChange?.pendingPlanId
    ? availablePlans.find((p) => p.id === confirmPlanChange.pendingPlanId)
    : null;

  return (
    <>
      <TabPageLayout
        title="Plans"
        subheader="Choose your training plan or create a new one in the Create tab."
        activeTab="plans"
        onTrainingClick={() => router.push('/')}
        onPlansClick={() => {}}
        onCreateClick={() => router.push('/create')}
        onSettingsClick={() => router.push('/settings')}
      >
        <PlanSelectorSection
          availablePlans={availablePlans}
          activePlanId={activePlanId}
          currentUserId={user?.id}
          onPlanChange={handlePlanChange}
          onPlanDeleted={refreshAvailablePlans}
          planProgress={planProgress}
        />
      </TabPageLayout>

      <ConfirmSwitchPlanModal
        isOpen={confirmPlanChange !== null}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmPlanChange}
        planName={pendingPlan?.name ?? 'this plan'}
      />
    </>
  );
}
