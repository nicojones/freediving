'use client';
import { useState, useRef, useCallback } from 'react';
import type { PlanWithMeta } from '../../types/plan';

interface AIVoicePlanInputProps {
  onResult: (json: string) => void;
  disabled?: boolean;
  onRecordingChange?: (recording: boolean) => void;
}

export function AIVoicePlanInput({ onResult, disabled, onRecordingChange }: AIVoicePlanInputProps) {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone not supported. Use JSON upload instead.');
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size === 0) {
          setError('No audio recorded. Try again.');
          return;
        }
        setLoading(true);
        setError(null);
        try {
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');
          const res = await fetch('/api/plans/transcribe', {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });
          const data = (await res.json().catch(() => ({}))) as
            | PlanWithMeta
            | { error?: string; details?: string[] };
          if (!res.ok) {
            const err = data as { error?: string; details?: string[] };
            const msg = err.details?.length
              ? err.details.join('\n')
              : (err.error ?? `Request failed (${res.status})`);
            setError(msg);
            return;
          }
          const plan = data as PlanWithMeta;
          onResult(JSON.stringify(plan, null, 2));
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not transcribe. Try again or paste JSON manually.'
          );
        } finally {
          setLoading(false);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      onRecordingChange?.(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not access microphone.');
    }
  }, [onResult, onRecordingChange]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setRecording(false);
    onRecordingChange?.(false);
  }, [onRecordingChange]);

  const handleClick = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className="h-12 rounded-xl border-2 border-primary/60 bg-primary/10 hover:bg-primary/20 font-headline font-bold text-primary text-sm flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={recording ? 'Stop recording' : 'Record with AI'}
      >
        {loading ? (
          <>
            <span className="material-symbols-outlined animate-spin text-xl" aria-hidden>
              progress_activity
            </span>
            Transcribing…
          </>
        ) : recording ? (
          <>
            <span className="material-symbols-outlined text-xl text-error" aria-hidden>
              stop
            </span>
            Stop recording
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-xl" aria-hidden>
              mic
            </span>
            AI voice
          </>
        )}
      </button>
      {error && <p className="text-error text-sm font-body">{error}</p>}
    </div>
  );
}
