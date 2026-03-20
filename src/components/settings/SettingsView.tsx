'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DEFAULT_PLAN_NAME } from '../../constants/app'
import { TopAppBar } from '../layout/TopAppBar'
import { BottomNavBar } from '../layout/BottomNavBar'
import { DevModeSection } from './DevModeSection'
import { PlanSelectorSection } from './PlanSelectorSection'
import { CreatePlanSection } from './CreatePlanSection'
import { ResetProgressSection } from './ResetProgressSection'
import { ConfirmResetModal } from './ConfirmResetModal'
import { UserProfileCard } from './UserProfileCard'
import { useTraining } from '../../hooks/useTraining'
import { DEFAULT_USERNAME } from '../../constants/app'

type ConfirmType = 'reset' | 'planChange' | null

export function SettingsView() {
  const router = useRouter()
  const {
    user,
    availablePlans,
    activePlanId,
    planWithMeta,
    resetProgress,
    setActivePlan,
    refreshAvailablePlans,
    handleLogout,
  } = useTraining()
  const username = user?.username ?? DEFAULT_USERNAME

  const [confirmState, setConfirmState] = useState<{
    type: ConfirmType
    pendingPlanId?: string
  }>({ type: null })

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPlanId = e.target.value
    if (newPlanId === activePlanId) {return}
    setConfirmState({ type: 'planChange', pendingPlanId: newPlanId })
  }

  const handleRequestReset = () => {
    setConfirmState({ type: 'reset' })
  }

  const handleCloseConfirm = () => {
    setConfirmState({ type: null })
  }

  const handleConfirmReset = async () => {
    await resetProgress()
  }

  const handleConfirmPlanChange = async () => {
    if (confirmState.pendingPlanId) {
      await setActivePlan(confirmState.pendingPlanId)
    }
  }

  const planName = planWithMeta?.name ?? DEFAULT_PLAN_NAME

  return (
    <div className="min-h-screen bg-background pb-32 min-w-0 overflow-x-hidden">
      <TopAppBar variant="dashboard" weekLabel="Settings" planName={planName} />
      <main
        className="px-6 pt-8 max-w-2xl mx-auto"
        style={{
          background:
            'linear-gradient(180deg, rgba(82, 218, 211, 0.05) 0%, rgba(13, 20, 22, 0) 100%)',
        }}
      >
        <section className="mb-12">
          <h1 className="font-headline text-[2.5rem] font-extrabold tracking-tight leading-none mb-2">
            Settings
          </h1>
          <p className="text-on-surface-variant font-body text-sm max-w-[80%] mb-10">
            Account and app preferences.
          </p>

          <PlanSelectorSection
            availablePlans={availablePlans}
            activePlanId={activePlanId}
            onPlanChange={handlePlanChange}
          />

          <CreatePlanSection onPlanCreated={refreshAvailablePlans} />

          <ResetProgressSection onRequestReset={handleRequestReset} />

          <DevModeSection />

          <UserProfileCard username={username} />

          <button
            type="button"
            onClick={handleLogout}
            className="w-full h-16 rounded-xl border-2 border-outline-variant/60 bg-surface-container-low/50 hover:bg-surface-container-low hover:border-outline font-headline font-bold text-on-surface text-lg flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden>
              logout
            </span>
            Sign out
          </button>
        </section>
      </main>
      <BottomNavBar
        activeTab="settings"
        onTrainingClick={() => router.push('/')}
        onSettingsClick={() => {}}
      />

      <ConfirmResetModal
        isOpen={confirmState.type === 'reset'}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmReset}
        title="Reset progress"
        message={
          <>
            This will clear all progress for this plan. Type <strong className="text-on-surface">reset</strong> to confirm.
          </>
        }
      />

      <ConfirmResetModal
        isOpen={confirmState.type === 'planChange'}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmPlanChange}
        title="Change training plan"
        message={
          <>
            Changing plan will reset your progress. Type <strong className="text-on-surface">reset</strong> to confirm.
          </>
        }
      />
    </div>
  )
}
