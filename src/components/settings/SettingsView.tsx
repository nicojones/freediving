'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TabPageLayout } from '../layout/TabPageLayout';
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
    <>
      <TabPageLayout
        title="Settings"
        subheader="Account and app preferences."
        activeTab="settings"
        onTrainingClick={() => router.push('/')}
        onPlansClick={() => router.push('/plans')}
        onCreateClick={() => router.push('/create')}
        onSettingsClick={() => {}}
      >
        <div className="flex flex-col gap-y-6">
          <InstallPrompt variant="compact" />

          <ResetProgressSection onRequestReset={handleRequestReset} />

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

          <DevModeSection />

          <div className="text-center pb-8">
            <VersionFooter />
          </div>
        </div>
      </TabPageLayout>

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
    </>
  );
}
