import { TopAppBar } from './TopAppBar'
import { BottomNavBar } from './BottomNavBar'

interface SettingsViewProps {
  username: string
  onLogout: () => void
  onTrainingClick: () => void
}

export function SettingsView({
  username,
  onLogout,
  onTrainingClick,
}: SettingsViewProps) {
  return (
    <div className="min-h-screen bg-background pb-32">
      <TopAppBar variant="dashboard" weekLabel="Settings" planName="" />
      <main className="px-6 pt-8 max-w-2xl mx-auto">
        <section className="mb-12">
          <h1 className="font-headline text-[2.5rem] font-extrabold tracking-tight leading-none mb-2">
            Settings
          </h1>
          <p className="text-on-surface-variant font-body text-sm mb-8">
            Account and app preferences.
          </p>
          <div className="bg-surface-container-low rounded-2xl p-6">
            <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em] block mb-2">
              Logged in as
            </span>
            <p className="text-on-surface font-headline text-xl font-bold">
              {username}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-6 text-primary font-label hover:underline"
          >
            Sign out
          </button>
        </section>
      </main>
      <BottomNavBar
        activeTab="settings"
        onTrainingClick={onTrainingClick}
        onSettingsClick={() => {}}
      />
    </div>
  )
}
