'use client'
import { PrimaryButton } from '../ui/PrimaryButton'
import { TopAppBar } from '../layout/TopAppBar'
import { BottomNavBar } from '../layout/BottomNavBar'
import { useTraining } from '../../hooks/useTraining'

export function SessionCompleteView() {
  const { handleBackToTraining, handleSettingsClick } = useTraining()

  return (
    <div className="min-h-screen bg-background">
      <TopAppBar variant="dashboard" />
      <main className="px-6 pt-8 pb-32 max-w-2xl mx-auto">
        <div className="bg-surface-container-low rounded-3xl p-8 text-center">
          <span
            className="material-symbols-outlined text-6xl text-primary mb-4"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">
            Session Complete
          </h2>
          <p className="text-on-surface-variant font-body mb-6">
            Great work. Your progress has been saved.
          </p>
          <PrimaryButton onClick={handleBackToTraining} icon="arrow_forward">
            Back to Training
          </PrimaryButton>
        </div>
      </main>
      <BottomNavBar
        activeTab="training"
        onTrainingClick={() => {}}
        onSettingsClick={handleSettingsClick}
      />
    </div>
  )
}
