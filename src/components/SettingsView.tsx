import { useNavigate } from 'react-router-dom'
import { TopAppBar } from './TopAppBar'
import { BottomNavBar } from './BottomNavBar'
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

  const planName = planWithMeta?.name ?? 'CO2 Tolerance III'

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

          <div className="bg-surface-container-low rounded-3xl p-6 mb-6 overflow-hidden border border-outline-variant/30">
            <h2 className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">
              Training plan
            </h2>
            <select
              value={activePlanId ?? ''}
              onChange={handlePlanChange}
              className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant/60 bg-surface-container-low/50 text-on-surface font-body text-base focus:border-primary focus:outline-none"
              aria-label="Select training plan"
            >
              {availablePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-surface-container-low rounded-3xl p-6 mb-6 overflow-hidden border border-outline-variant/30">
            <h2 className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">
              Reset progress
            </h2>
            <p className="text-on-surface-variant font-body text-sm mb-4">
              Clear all completed days for the current plan. This cannot be
              undone.
            </p>
            <button
              type="button"
              onClick={handleResetProgress}
              className="w-full h-12 rounded-xl border-2 border-error/50 bg-error/10 hover:bg-error/20 font-headline font-bold text-error text-base flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-xl" aria-hidden>
                restart_alt
              </span>
              Reset progress
            </button>
          </div>

          <div className="bg-surface-container-low rounded-3xl p-6 mb-8 overflow-hidden border border-outline-variant/30">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                <span
                  className="material-symbols-outlined text-primary text-2xl"
                  aria-hidden
                >
                  person
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em] block mb-1">
                  Logged in as
                </span>
                <p className="text-on-surface font-headline text-xl font-bold truncate">
                  {username}
                </p>
              </div>
            </div>
          </div>

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
