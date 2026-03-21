'use client';

import { useState, useRef } from 'react';
import type { PlanWithMeta } from '../../../types/plan';
import { validatePlanWithMeta } from '../../../schemas/planSchema';
import { parseJson } from '../../../utils/parseJson';

export function useCreatePlanHandlers(onPlanCreated?: () => void) {
  const [describeText, setDescribeText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceSubmitting, setVoiceSubmitting] = useState(false);
  const [draftPlan, setDraftPlan] = useState<PlanWithMeta | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [refineText, setRefineText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewJustUpdated, setPreviewJustUpdated] = useState(false);
  const previewJustUpdatedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAbortSignal = () => {
    abortControllerRef.current?.abort();
    const ctrl = new AbortController();
    abortControllerRef.current = ctrl;
    return ctrl.signal;
  };

  const schedulePreviewJustUpdatedClear = () => {
    if (previewJustUpdatedTimeoutRef.current) {
      clearTimeout(previewJustUpdatedTimeoutRef.current);
    }
    previewJustUpdatedTimeoutRef.current = setTimeout(() => {
      setPreviewJustUpdated(false);
      previewJustUpdatedTimeoutRef.current = null;
    }, 2000);
  };

  const openPreview = () => {
    setPreviewJustUpdated(false);
    if (previewJustUpdatedTimeoutRef.current) {
      clearTimeout(previewJustUpdatedTimeoutRef.current);
      previewJustUpdatedTimeoutRef.current = null;
    }
    setPreviewModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setError(null);
    setSuccess(false);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const parsed = parseJson(text, null) as unknown;
      if (parsed === null || typeof parsed === 'string') {
        setError('Invalid JSON');
        return;
      }
      const result = validatePlanWithMeta(parsed);
      if (result.success) {
        setJsonText(JSON.stringify(result.data, null, 2));
        setError(null);
      } else {
        setError(result.errors.join('\n'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCreateDraft = async () => {
    const val = describeText.trim();
    if (!val) {
      return;
    }
    setError(null);
    setIsCreatingDraft(true);
    const signal = getAbortSignal();
    try {
      const res = await fetch('/api/plans/transcribe-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: val }),
        credentials: 'include',
        signal,
      });
      const data = (await res.json().catch(() => ({}))) as
        | { error?: string; details?: string[] }
        | PlanWithMeta;
      if (!res.ok) {
        const err = data as { error?: string; details?: string[] };
        const msg = err.details?.length
          ? err.details.join('\n')
          : (err.error ?? `Failed (${res.status})`);
        setError(msg);
        return;
      }
      const plan = data as PlanWithMeta;
      const result = validatePlanWithMeta(plan);
      if (result.success) {
        setDraftPlan(result.data);
        setDescribeText('');
        setError(null);
        setPreviewJustUpdated(true);
        schedulePreviewJustUpdatedClear();
      } else {
        setError(result.errors.join('\n'));
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const handleRefine = async () => {
    const val = refineText.trim();
    if (!val || !draftPlan) {
      return;
    }
    setError(null);
    setIsRefining(true);
    const signal = getAbortSignal();
    try {
      const res = await fetch('/api/plans/transcribe-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: val, contextPlan: draftPlan }),
        credentials: 'include',
        signal,
      });
      const data = (await res.json().catch(() => ({}))) as
        | { error?: string; details?: string[] }
        | PlanWithMeta;
      if (!res.ok) {
        const err = data as { error?: string; details?: string[] };
        const msg = err.details?.length
          ? err.details.join('\n')
          : (err.error ?? `Failed (${res.status})`);
        setError(msg);
        return;
      }
      const plan = data as PlanWithMeta;
      const result = validatePlanWithMeta(plan);
      if (result.success) {
        setDraftPlan(result.data);
        setRefineText('');
        setError(null);
        setPreviewJustUpdated(true);
        schedulePreviewJustUpdatedClear();
      } else {
        setError(result.errors.join('\n'));
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsRefining(false);
    }
  };

  const handleConfirmPlan = async (name: string, description: string) => {
    if (!draftPlan) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload = { ...draftPlan, name, description };
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        details?: string[];
      };
      if (!res.ok) {
        const msg = data.details?.length
          ? data.details.join('\n')
          : (data.error ?? `Failed to create plan (${res.status})`);
        setError(msg);
        return;
      }
      setSuccess(true);
      setDraftPlan(null);
      setRefineText('');
      onPlanCreated?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteTabCreate = async () => {
    const val = jsonText.trim();
    if (!val) {
      return;
    }
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const parsed = parseJson(val, null) as unknown;
      if (parsed === null || typeof parsed === 'string') {
        setError('Invalid JSON. Paste tab only accepts valid JSON.');
        setLoading(false);
        return;
      }
      const result = validatePlanWithMeta(parsed);
      if (!result.success) {
        setError(result.errors.join('\n'));
        setLoading(false);
        return;
      }
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
        credentials: 'include',
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        details?: string[];
      };
      if (!res.ok) {
        const msg = data.details?.length
          ? data.details.join('\n')
          : (data.error ?? `Failed to create plan (${res.status})`);
        setError(msg);
        setLoading(false);
        return;
      }
      setSuccess(true);
      setJsonText('');
      onPlanCreated?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = () => {
    setError(null);
    setSuccess(false);
    navigator.clipboard.readText().then(
      (text) => {
        const parsed = parseJson(text, null) as unknown;
        if (parsed === null || typeof parsed === 'string') {
          setError('Invalid JSON in clipboard');
          return;
        }
        const result = validatePlanWithMeta(parsed);
        if (result.success) {
          setJsonText(JSON.stringify(result.data, null, 2));
          setError(null);
        } else {
          setError(result.errors.join('\n'));
        }
      },
      () => setError('Could not read clipboard')
    );
  };

  const handleVoiceResult = (json: string) => {
    const parsed = parseJson(json, null) as unknown;
    if (parsed === null || typeof parsed === 'string') {
      setError('Invalid JSON from voice');
      return;
    }
    const result = validatePlanWithMeta(parsed);
    if (result.success) {
      setDraftPlan(result.data);
      setDescribeText('');
      setError(null);
      setPreviewJustUpdated(true);
      schedulePreviewJustUpdatedClear();
    } else {
      setError(result.errors.join('\n'));
    }
  };

  const handleVoiceRefineResult = (json: string) => {
    const parsed = parseJson(json, null) as unknown;
    if (parsed === null || typeof parsed === 'string') {
      setError('Invalid JSON from voice refine');
      return;
    }
    const result = validatePlanWithMeta(parsed);
    if (result.success) {
      setDraftPlan(result.data);
      setRefineText('');
      setError(null);
      setPreviewJustUpdated(true);
      schedulePreviewJustUpdatedClear();
    } else {
      setError(result.errors.join('\n'));
    }
  };

  const resetDraftFlow = () => {
    setDraftPlan(null);
    setRefineText('');
    setError(null);
  };

  return {
    describeText,
    setDescribeText,
    jsonText,
    setJsonText,
    error,
    setError,
    success,
    loading,
    recording,
    setRecording,
    voiceSubmitting,
    setVoiceSubmitting,
    getAbortSignal,
    draftPlan,
    isCreatingDraft,
    refineText,
    setRefineText,
    isRefining,
    confirmModalOpen,
    setConfirmModalOpen,
    previewModalOpen,
    setPreviewModalOpen,
    previewJustUpdated,
    fileInputRef,
    handleFileSelect,
    handleCreateDraft,
    handleRefine,
    handleConfirmPlan,
    handlePasteTabCreate,
    handlePaste,
    handleVoiceResult,
    handleVoiceRefineResult,
    resetDraftFlow,
    openPreview,
  };
}
