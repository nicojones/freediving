'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TabPageLayout } from '@/src/components/layout/TabPageLayout';
import { PlanSelectorSection } from '@/src/components/settings/PlanSelectorSection';
import { ConfirmResetModal } from '@/src/components/settings/ConfirmResetModal';
import { useTraining } from '@/src/hooks/useTraining';

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
    }
    handleCloseConfirm();
  };

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
        />
      </TabPageLayout>

      <ConfirmResetModal
        isOpen={confirmPlanChange !== null}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmPlanChange}
        title="Change training plan"
        message={
          <>
            Changing plan will reset your progress. Type{' '}
            <strong className="text-on-surface">reset</strong> to confirm.
          </>
        }
      />
    </>
  );
}
