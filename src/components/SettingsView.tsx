import { useNavigate } from 'react-router-dom'
import { DEFAULT_PLAN_NAME } from '../constants/app'
import { TopAppBar } from './TopAppBar'
import { BottomNavBar } from './BottomNavBar'
import { PlanSelectorSection } from './PlanSelectorSection'
import { ResetProgressSection } from './ResetProgressSection'
import { UserProfileCard } from './UserProfileCard'
import { useTraining } from '../contexts/TrainingContext'

interface SettingsViewProps {
  username: string
  onLogout: () => void
}

export function SettingsView({ username, onLogout }: SettingsViewProps) {
  const navigate = useNavigate()
  const {
    availablePlans,
    activePlanId,
    planWithMeta,
    resetProgress,
    setActivePlan,
  } = useTraining()

  const handlePlanChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPlanId = e.target.value
    if (newPlanId === activePlanId) return
    const confirmed = window.confirm(
      'Changing plan will reset your progress. Continue?'
    )
    if (!confirmed) return
    await setActivePlan(newPlanId)
  }

  const handleResetProgress = async () => {
    const confirmed = window.confirm(
      'This will clear all progress for this plan. Continue?'
    )
    if (!confirmed) return
    await resetProgress()
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

          <ResetProgressSection onResetProgress={handleResetProgress} />

          <UserProfileCard username={username} />

          <button
            type="button"
            onClick={onLogout}
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
        onTrainingClick={() => navigate('/')}
        onSettingsClick={() => {}}
      />
    </div>
  )
}
