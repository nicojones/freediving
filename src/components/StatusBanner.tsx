interface StatusBannerProps {
  progressError?: string | null
  savedMessage?: boolean
}

export function StatusBanner({ progressError, savedMessage }: StatusBannerProps) {
  if (progressError) {
    return (
      <p className="px-6 py-3 w-full text-center text-error bg-error/20 rounded-lg text-sm font-body mb-4">
        {progressError}
      </p>
    )
  }
  if (savedMessage) {
    return (
      <p className="px-6 py-3 w-full text-center text-primary bg-primary/20 rounded-lg text-sm font-body mb-4">
        Saved
      </p>
    )
  }
  return null
}
