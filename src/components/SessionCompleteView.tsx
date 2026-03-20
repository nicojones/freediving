'use client'
import { DEFAULT_PLAN_NAME } from '../constants/app'
import { PrimaryButton } from './PrimaryButton'
import { TopAppBar } from './TopAppBar'
import { BottomNavBar } from './BottomNavBar'
import { useTraining } from '../contexts/TrainingContext'

export function SessionCompleteView() {
  const { planWithMeta, handleBackToTraining, handleSettingsClick } = useTraining()
  const planName = planWithMeta?.name ?? DEFAULT_PLAN_NAME

  return (
    <div className="min-h-screen bg-background">
      <TopAppBar variant="dashboard" planName={planName} />
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
