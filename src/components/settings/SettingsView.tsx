'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopAppBar } from '../layout/TopAppBar';
import { BottomNavBar } from '../layout/BottomNavBar';
import { DevModeSection } from './DevModeSection';
import { ResetProgressSection } from './ResetProgressSection';
import { ConfirmResetModal } from './ConfirmResetModal';
import { UserProfileCard } from './UserProfileCard';
import { InstallPrompt } from '../layout/InstallPrompt';
import { VersionFooter } from '../shared/VersionFooter';
import { useTraining } from '../../hooks/useTraining';
import { DEFAULT_USERNAME } from '../../constants/app';

export function SettingsView() {
  const router = useRouter();
  const { user, resetProgress, handleLogout } = useTraining();
  const username = user?.username ?? DEFAULT_USERNAME;

  const [confirmReset, setConfirmReset] = useState(false);

  const handleRequestReset = () => {
    setConfirmReset(true);
  };

  const handleCloseConfirm = () => {
    setConfirmReset(false);
  };

  const handleConfirmReset = async () => {
    await resetProgress();
  };

  return (
    <div className="min-h-screen bg-background pb-32 min-w-0 overflow-x-hidden">
      <TopAppBar variant="dashboard" weekLabel="Settings" />
      <main
        className="px-6 pt-8 max-w-2xl mx-auto rounded-3xl transition-all duration-300"
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

          <InstallPrompt variant="compact" />

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

          <div className="pt-12 pb-8 text-center">
            <VersionFooter />
          </div>
        </section>
      </main>
      <BottomNavBar
        activeTab="settings"
        onTrainingClick={() => router.push('/')}
        onPlansClick={() => router.push('/plans')}
        onSettingsClick={() => {}}
      />

      <ConfirmResetModal
        isOpen={confirmReset}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmReset}
        title="Reset progress"
        message={
          <>
            This will clear all progress for this plan. Type{' '}
            <strong className="text-on-surface">reset</strong> to confirm.
          </>
        }
      />
    </div>
  );
}
