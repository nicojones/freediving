import { useNavigate } from 'react-router-dom'
import { TopAppBar } from './TopAppBar'
import { BottomNavBar } from './BottomNavBar'

interface SettingsViewProps {
  username: string
  onLogout: () => void
}

export function SettingsView({ username, onLogout }: SettingsViewProps) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-background pb-32 min-w-0 overflow-x-hidden">
      <TopAppBar variant="dashboard" weekLabel="Settings" planName="" />
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
