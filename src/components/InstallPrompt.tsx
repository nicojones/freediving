import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt({ hasEngaged = true }: { hasEngaged?: boolean }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false)
      return
    }

    const dismissedSession = sessionStorage.getItem('install-prompt-dismissed')
    if (dismissedSession) {
      setDismissed(true)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    const isIOS =
      navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')
    if (isIOS && !window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(true)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setDismissed(true)
  }

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('install-prompt-dismissed', '1')
  }

  const isIOS =
    typeof navigator !== 'undefined' &&
    (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad'))

  if (!showPrompt || dismissed || !hasEngaged) return null

  return (
    <div className="mb-6 bg-surface-container-low rounded-2xl p-4 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-on-surface font-label font-semibold text-sm uppercase tracking-wider">
          Install Submerged
        </p>
        <p className="text-on-surface-variant text-sm mt-1">
          {deferredPrompt
            ? 'Add to your home screen for the best experience.'
            : 'Tap Share → Add to Home Screen to install.'}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {deferredPrompt ? (
          <button
            type="button"
            onClick={handleInstall}
            className="primary-pulse-gradient px-4 py-2 rounded-xl font-headline font-bold text-on-primary text-sm"
          >
            Install
          </button>
        ) : isIOS ? (
          <span className="text-primary font-label text-xs uppercase tracking-wider">
            Share → Add to Home Screen
          </span>
        ) : null}
        <button
          type="button"
          onClick={handleDismiss}
          className="text-on-surface-variant hover:text-on-surface p-2 rounded-lg transition-colors"
          aria-label="Dismiss"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>
    </div>
  )
}
