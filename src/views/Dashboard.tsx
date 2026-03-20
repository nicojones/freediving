'use client';
import clsx from 'clsx';
import { isNil } from '../utils/lang';
import { useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BottomNavBar } from '../components/layout/BottomNavBar';
import { DayListSection } from '../components/day/DayListSection';
import { InstallPrompt } from '../components/layout/InstallPrompt';
import { PlanCompleteMessage } from '../components/day/PlanCompleteMessage';
import { RestDayCard } from '../components/day/RestDayCard';
import { SessionPreviewSection } from '../components/session/SessionPreviewSection';
import { StatusBanner } from '../components/shared/StatusBanner';
import { TopAppBar } from '../components/layout/TopAppBar';
import { DEFAULT_PLAN_NAME } from '../constants/app';
import { useTraining } from '../hooks/useTraining';
import {
  getCurrentDay,
  getDayGroup,
  getDayId,
  getDayIndexById,
  getPhasesForDay,
} from '../services/planService';
import { getCompletionDateForDay, isDayCompleted } from '../utils/completions';

/** Dashboard: ~162 lines. Slightly over 150; further extraction would split cohesive day/session routing logic. */
export function Dashboard() {
  const router = useRouter();
  const params = useParams();
  const urlDayId = params?.dayId as string | undefined;
  const {
    plan,
    planWithMeta,
    completions,
    viewMode,
    selectedDayIndex,
    speedMultiplier,
    audioLoading,
    progressError,
    savedMessage,
    hasCompletedToday,
    testMode,
    showTestControls,
    setSelectedDayIndex,
    setViewMode,
    setSpeedMultiplier,
    setTestMode,
    handleStartSession,
  } = useTraining();

  const handleSelectDay = useCallback(
    (index: number) => {
      if (isNil(plan)) {
        return;
      }
      const id = getDayId(plan, index);
      if (id) {
        router.push(`/day/${id}`);
      }
      setSelectedDayIndex(index);
      setViewMode('session-preview');
    },
    [plan, router, setSelectedDayIndex, setViewMode]
  );

  const handleBack = useCallback(() => {
    router.push('/');
    setViewMode('dashboard');
    if (!isNil(plan)) {
      const current = getCurrentDay(plan, completions);
      setSelectedDayIndex(current);
    }
  }, [plan, completions, router, setViewMode, setSelectedDayIndex]);

  const handleStartSessionClick = useCallback(async () => {
    await handleStartSession();
    router.push('/session');
  }, [handleStartSession, router]);

  const handleTrainingClick = useCallback(() => router.push('/'), [router]);
  const handlePlansClick = useCallback(() => router.push('/plans'), [router]);
  const handleSettingsClick = useCallback(() => router.push('/settings'), [router]);

  // Sync URL dayId to selected day; invalid dayId → redirect to /
  useEffect(() => {
    if (isNil(plan)) {
      return;
    }
    if (urlDayId) {
      const idx = getDayIndexById(plan, urlDayId);
      if (idx === null) {
        router.replace('/');
      } else {
        setSelectedDayIndex(idx);
        setViewMode('session-preview');
      }
    }
  }, [urlDayId, plan, router, setSelectedDayIndex, setViewMode]);

  if (isNil(plan)) {
    return null;
  }

  const p = plan!;
  const currentDayIndex = getCurrentDay(p, completions);
  const selectedPhases = selectedDayIndex !== null ? getPhasesForDay(p, selectedDayIndex) : null;
  const isRestDay = selectedPhases === null && selectedDayIndex !== null;
  const isPlanComplete = selectedDayIndex === null && p.length > 0;
  const showSessionPreview =
    viewMode === 'session-preview' &&
    selectedDayIndex !== null &&
    selectedPhases !== null &&
    !isRestDay;
  const showDayDetail = selectedDayIndex !== null;
  const planName = planWithMeta?.name ?? DEFAULT_PLAN_NAME;
  const selectedDayId =
    selectedDayIndex !== null ? (getDayId(p, selectedDayIndex) ?? undefined) : undefined;
  const isSelectedDayCompleted = showSessionPreview && isDayCompleted(completions, selectedDayId);

  return (
    <div className="min-h-screen bg-background pb-32 min-w-0 overflow-x-hidden">
      <TopAppBar
        variant={showDayDetail ? 'session-preview' : 'dashboard'}
        weekLabel="Current Week"
      />
      <main
        className={clsx(
          'px-6 pt-8 max-w-2xl mx-auto rounded-3xl transition-all duration-300',
          { 'pb-12': showDayDetail },
          isSelectedDayCompleted &&
            'ring-2 ring-emerald-500/60 shadow-[0_0_32px_rgba(5,150,105,0.15)]'
        )}
        style={{
          background:
            'linear-gradient(180deg, rgba(82, 218, 211, 0.05) 0%, rgba(13, 20, 22, 0) 100%)',
        }}
      >
        <StatusBanner progressError={progressError} savedMessage={savedMessage} />

        {!showSessionPreview && <InstallPrompt />}

        {showDayDetail && isRestDay && viewMode === 'session-preview' ? (
          <RestDayCard
            dayIndex={selectedDayIndex!}
            isCompleted={isDayCompleted(completions, getDayId(p, selectedDayIndex!) ?? undefined)}
            isPreview={currentDayIndex !== null && selectedDayIndex! > currentDayIndex}
            onBack={handleBack}
          />
        ) : !showSessionPreview ? (
          <DayListSection
            plan={p}
            completions={completions}
            currentDayIndex={currentDayIndex}
            onSelectDay={handleSelectDay}
            planName={planName}
            planDescription={planWithMeta?.description}
          />
        ) : (
          selectedPhases && (
            <SessionPreviewSection
              selectedDayIndex={selectedDayIndex!}
              selectedPhases={selectedPhases}
              planName={planWithMeta?.name}
              dayGroup={getDayGroup(p, selectedDayIndex!)}
              currentDayIndex={currentDayIndex}
              speedMultiplier={speedMultiplier}
              testMode={showTestControls ? testMode : false}
              showTestControls={showTestControls}
              audioLoading={audioLoading}
              hasCompletedToday={hasCompletedToday}
              isDayCompleted={isDayCompleted(completions, selectedDayId)}
              completedAt={getCompletionDateForDay(completions, selectedDayId)}
              onBack={handleBack}
              onSpeedMultiplierChange={setSpeedMultiplier}
              onTestModeChange={showTestControls ? setTestMode : () => {}}
              onStartSession={handleStartSessionClick}
            />
          )
        )}

        {isPlanComplete && <PlanCompleteMessage />}
      </main>

      {!showSessionPreview && (
        <BottomNavBar
          activeTab="training"
          onTrainingClick={handleTrainingClick}
          onPlansClick={handlePlansClick}
          onSettingsClick={handleSettingsClick}
        />
      )}
    </div>
  );
}
