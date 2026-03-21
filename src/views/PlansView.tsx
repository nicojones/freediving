'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { TabPageLayout } from '@/src/components/layout/TabPageLayout';
import { ActivePlanSection } from '@/src/components/settings/ActivePlanSection';
import { PlanFilterRadio, type PlanFilter } from '@/src/components/settings/PlanFilterRadio';
import { PlanSelectorSection } from '@/src/components/settings/PlanSelectorSection';
import { ConfirmSwitchPlanModal } from '@/src/components/settings/ConfirmSwitchPlanModal';
import { useTraining } from '@/src/hooks/useTraining';
import { fetchCompletions } from '@/src/services/progressService';
import { fetchPlansFromApi } from '@/src/services/planService';
import type { PlanWithMeta } from '@/src/types/plan';

const filterPlans = (
  plans: PlanWithMeta[],
  filter: PlanFilter,
  currentUserId: number | undefined
) => {
  if (filter === 'all') {
    return plans;
  }
  if (filter === 'my') {
    return plans.filter((p) => p.created_by === currentUserId);
  }
  return plans.filter((p) => p.public === true);
};

/**
 * Plans tab: change plan, add plan, delete plan (user-created, non-active).
 *
 * Future enhancement: explore plans without switching active plan.
 * Structure (plan list with select + delete) leaves room for adding
 * a "preview/explore" mode — user could browse plan details without changing
 * their active plan. Do not implement; only ensure no dead ends block this.
 */
export const PlansView = () => {
  const router = useRouter();
  const { user, availablePlans, activePlanId, planWithMeta, setActivePlan, refreshAvailablePlans } =
    useTraining();

  const [filter, setFilter] = useState<PlanFilter>('all');
  const [confirmPlanChange, setConfirmPlanChange] = useState<{
    pendingPlanId: string;
  } | null>(null);

  const [planProgress, setPlanProgress] = useState<
    Record<string, { completed: number; total: number }>
  >({});

  const filteredPlans = filterPlans(availablePlans, filter, user?.id);

  const refreshPlanProgress = useCallback(
    async (plansOverride?: PlanWithMeta[]) => {
      const plans = plansOverride ?? availablePlans;
      if (!user || plans.length === 0) {
        return;
      }
      const results = await Promise.all(
        plans.map(async (p) => {
          const c = await fetchCompletions(p.id);
          return { id: p.id, completed: c.length, total: p.days.length };
        })
      );
      const record: Record<string, { completed: number; total: number }> = {};
      for (const r of results) {
        record[r.id] = { completed: r.completed, total: r.total };
      }
      setPlanProgress(record);
    },
    [user, availablePlans]
  );

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
      // Use fresh plans — closure may have stale availablePlans before React re-renders.
      const freshPlans = await fetchPlansFromApi();
      await refreshPlanProgress(freshPlans);
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
        <Disclosure
          as="div"
          className="bg-surface-container-low rounded-3xl p-6 mb-6 overflow-hidden border border-outline-variant/30"
          data-testid="plans-how-it-works"
        >
          <DisclosureButton className="flex items-center justify-between w-full text-left">
            <h2 className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
              How it works
            </h2>
            <span
              className="material-symbols-outlined text-base text-on-surface-variant transition-transform duration-200 data-open:rotate-45"
              aria-hidden
            >
              add
            </span>
          </DisclosureButton>
          <DisclosurePanel className="pt-4 text-on-surface-variant text-sm font-body">
            Plans are a way to create training programs for breathhold. You can go to the{' '}
            <Link href="/create" className="text-primary underline">
              Create
            </Link>{' '}
            tab and create one by describing what you want.
          </DisclosurePanel>
        </Disclosure>

        <ActivePlanSection
          plan={planWithMeta}
          progress={activePlanId ? planProgress[activePlanId] : undefined}
          currentUserId={user?.id}
          onPlanEdited={refreshAvailablePlans}
          onPlanReset={refreshPlanProgress}
        />

        <PlanFilterRadio value={filter} onChange={setFilter} />

        <PlanSelectorSection
          availablePlans={filteredPlans}
          activePlanId={activePlanId}
          currentUserId={user?.id}
          onPlanChange={handlePlanChange}
          onPlanDeleted={refreshAvailablePlans}
          onPlanEdited={refreshAvailablePlans}
          onPlanReset={refreshPlanProgress}
          planProgress={planProgress}
        />

        <Link
          href="/create"
          className="flex items-center justify-center w-full py-3 px-6 rounded-xl font-headline font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors"
          data-testid="create-plan-button"
        >
          Create Plan
        </Link>
      </TabPageLayout>

      <ConfirmSwitchPlanModal
        isOpen={confirmPlanChange !== null}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmPlanChange}
        planName={pendingPlan?.name ?? 'this plan'}
      />
    </>
  );
};
