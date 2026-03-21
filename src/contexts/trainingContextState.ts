import { createContext } from 'react';
import type { TimerState, SessionStatus } from '../hooks/useSessionEngine';
import type { Completion } from '../services/progressService';
import type { Plan, PlanWithMeta } from '../types/plan';

export type ViewMode = 'dashboard' | 'session-preview' | 'settings';

export interface TrainingContextValue {
  // Auth
  user: { id: number; username: string; email?: string | null } | null | undefined;
  refreshUser: () => Promise<void>;

  // Plan & progress
  plan: Plan | null;
  planWithMeta: PlanWithMeta | null;
  activePlanId: string | null;
  availablePlans: PlanWithMeta[];
  activePlanLoading: boolean;
  error: string | null;
  completions: Completion[];
  progressError: string | null;
  resetProgress: () => Promise<void>;
  setActivePlan: (planId: string) => Promise<void>;
  refreshAvailablePlans: () => Promise<void>;

  // UI
  selectedDayIndex: number | null;
  viewMode: ViewMode;
  savedMessage: boolean;

  // Session
  sessionStatus: SessionStatus;
  sessionDayIndex: number | null;
  timerState: TimerState | null;
  audioLoading: boolean;
  speedMultiplier: number;
  testMode: boolean;
  showTestControls: boolean;
  hasCompletedToday: boolean;

  // Actions
  setSelectedDayIndex: (index: number | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setSpeedMultiplier: (speed: number) => void;
  setTestMode: (v: boolean) => void;
  handleStartSession: () => Promise<void>;
  handleAbortSession: () => void;
  handleCompleteSession: () => Promise<void>;
  handleBackFromComplete: () => void;
  handleBackToTraining: () => void;
  handleSettingsClick: () => void;
  handleLogout: () => Promise<void>;
}

export const TrainingContext = createContext<TrainingContextValue | null>(null);
