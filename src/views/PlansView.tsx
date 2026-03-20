'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopAppBar } from '@/src/components/layout/TopAppBar';
import { BottomNavBar } from '@/src/components/layout/BottomNavBar';
import { PlanSelectorSection } from '@/src/components/settings/PlanSelectorSection';
import { CreatePlanSection } from '@/src/components/settings/CreatePlanSection';
import { PlanDeleteSection } from '@/src/components/settings/PlanDeleteSection';
import { ConfirmResetModal } from '@/src/components/settings/ConfirmResetModal';
import { useTraining } from '@/src/hooks/useTraining';

/**
 * Plans tab: change plan, add plan, delete plan (user-created, non-active).
 *
 * Future enhancement: explore plans without switching active plan.
 * Structure (plan list, selector, PlanDeleteSection) leaves room for adding
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

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPlanId = e.target.value;
    if (newPlanId === activePlanId) {
      return;
    }
    setConfirmPlanChange({ pendingPlanId: newPlanId });
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
    <div className="min-h-screen bg-background pb-32 min-w-0 overflow-x-hidden">
      <TopAppBar variant="dashboard" weekLabel="Plans" />
      <main
        className="px-6 pt-8 max-w-2xl mx-auto"
        style={{
          background:
            'linear-gradient(180deg, rgba(82, 218, 211, 0.05) 0%, rgba(13, 20, 22, 0) 100%)',
        }}
      >
        <section className="mb-12">
          <h1 className="font-headline text-[2.5rem] font-extrabold tracking-tight leading-none mb-2">
            Plans
          </h1>
          <p className="text-on-surface-variant font-body text-sm max-w-[80%] mb-10">
            Choose your training plan or create a new one.
          </p>

          <PlanSelectorSection
            availablePlans={availablePlans}
            activePlanId={activePlanId}
            onPlanChange={handlePlanChange}
          />

          <CreatePlanSection onPlanCreated={refreshAvailablePlans} />

          <PlanDeleteSection
            plans={availablePlans}
            activePlanId={activePlanId}
            currentUserId={user?.id}
            onPlanDeleted={refreshAvailablePlans}
          />
        </section>
      </main>
      <BottomNavBar
        activeTab="plans"
        onTrainingClick={() => router.push('/')}
        onPlansClick={() => {}}
        onSettingsClick={() => router.push('/settings')}
      />

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
    </div>
  );
}
