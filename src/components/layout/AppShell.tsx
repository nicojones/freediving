'use client'

import { useRouter, usePathname } from 'next/navigation'
import type { ChildrenNode } from '@/src/types/common'
import { FishIcon } from '@/src/components/ui/FishIcon'
import { Loader } from '@/src/components/ui/Loader'
import { LoginPage } from '@/src/views/LoginPage'
import { TopAppBar } from '@/src/components/layout/TopAppBar'
import { TrainingProvider, useTraining } from '@/src/contexts/TrainingContext'
import isNil from 'lodash/isNil'

function SessionRouteGuard({ children }: ChildrenNode) {
  const { sessionStatus } = useTraining()
  const router = useRouter()
  if (sessionStatus !== 'running' && sessionStatus !== 'awaitingCompletionConfirm') {
    router.replace('/')
    return null
  }
  return <>{children}</>
}

function SessionCompleteRouteGuard({ children }: ChildrenNode) {
  const { sessionStatus } = useTraining()
  const router = useRouter()
  if (sessionStatus !== 'complete') {
    router.replace('/')
    return null
  }
  return <>{children}</>
}

function AppContent({ children }: ChildrenNode) {
  const {
    user,
    refreshUser,
    plan,
    error,
    handleLogout,
  } = useTraining()
  const pathname = usePathname()

  if (user === undefined) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-background text-on-surface p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <FishIcon className="text-primary animate-pulse" size={28} aria-hidden />
            <span className="font-headline font-bold text-xl text-primary">Fishly</span>
          </div>
          <Loader />
        </div>
      </main>
    )
  }

  if (!user) {
    return <LoginPage onLoginSuccess={refreshUser} />
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background text-on-surface p-8 max-w-2xl mx-auto">
        <TopAppBar variant="dashboard" />
        <div className="pt-8">
          <p className="text-error font-body mb-4">{error}</p>
          <button
            onClick={handleLogout}
            className="text-primary font-label hover:underline"
          >
            Sign out
          </button>
        </div>
      </main>
    )
  }

  if (isNil(plan)) {
    return (
      <main className="min-h-screen bg-background text-on-surface p-8 max-w-2xl mx-auto">
        <TopAppBar variant="dashboard" />
        <div className="pt-8">
          <Loader label="Loading plan…" className="mb-4" />
          <button
            onClick={handleLogout}
            className="text-primary font-label hover:underline"
          >
            Sign out
          </button>
        </div>
      </main>
    )
  }

  if (pathname?.startsWith('/session/complete')) {
    return (
      <SessionCompleteRouteGuard>
        {children}
      </SessionCompleteRouteGuard>
    )
  }

  if (pathname === '/session') {
    return (
      <SessionRouteGuard>
        {children}
      </SessionRouteGuard>
    )
  }

  return <>{children}</>
}

export function AppShell({ children }: ChildrenNode) {
  return (
    <TrainingProvider>
      <AppContent>{children}</AppContent>
    </TrainingProvider>
  )
}
