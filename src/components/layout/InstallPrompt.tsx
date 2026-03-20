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
    if (!deferredPrompt) {return}
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

  if (!showPrompt || dismissed || !hasEngaged) {return null}

  return (
    <div className="mb-6 bg-surface-container-low rounded-3xl p-5 border border-outline-variant/30 overflow-hidden flex items-center gap-4">
      <div className="shrink-0 w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-2xl">
          {deferredPrompt ? 'download_2' : 'add_to_home_screen'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-headline font-bold text-on-surface text-base">
          Install Fishly
        </h3>
        <p className="text-on-surface-variant text-sm mt-0.5 leading-relaxed">
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
            className="primary-pulse-gradient px-5 py-2.5 rounded-xl font-headline font-bold text-on-primary text-sm shadow-[0_4px_12px_rgba(82,218,211,0.2)] hover:shadow-[0_4px_16px_rgba(82,218,211,0.3)] active:scale-[0.98] transition-all duration-300"
          >
            Install
          </button>
        ) : isIOS ? (
          <span className="text-primary font-label text-xs font-medium tracking-wide">
            Share → Add to Home Screen
          </span>
        ) : null}
        <button
          type="button"
          onClick={handleDismiss}
          className="text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-container-high/50 p-2 rounded-xl transition-colors duration-300"
          aria-label="Dismiss"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>
  )
}
