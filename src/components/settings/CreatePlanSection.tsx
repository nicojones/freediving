'use client'
import { useState, useRef } from 'react'
import { validatePlanWithMeta } from '../../schemas/planSchema'
import { AIVoicePlanInput } from '../../features/ai-plan'

interface CreatePlanSectionProps {
  onPlanCreated?: () => void
}

const btnBase =
  'h-12 rounded-xl border-2 border-outline-variant/60 bg-surface-container-low/50 hover:bg-surface-container-low hover:border-outline font-headline font-bold text-on-surface text-sm flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]'

export function CreatePlanSection({ onPlanCreated }: CreatePlanSectionProps) {
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) { return }
    setError(null)
    setSuccess(false)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result as string
        const parsed = JSON.parse(text) as unknown
        const result = validatePlanWithMeta(parsed)
        if (result.success) {
          setJsonText(JSON.stringify(result.data, null, 2))
          setError(null)
        } else {
          setError(result.errors.join('\n'))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid JSON')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleCreate = async () => {
    setError(null)
    setSuccess(false)
    try {
      const parsed = JSON.parse(jsonText) as unknown
      const result = validatePlanWithMeta(parsed)
      if (!result.success) {
        setError(result.errors.join('\n'))
        return
      }
      setLoading(true)
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
        credentials: 'include',
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        details?: string[]
      }
      if (!res.ok) {
        const msg = data.details?.length
          ? data.details.join('\n')
          : data.error ?? `Failed to create plan (${res.status})`
        setError(msg)
        return
      }
      setSuccess(true)
      setJsonText('')
      onPlanCreated?.()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const handlePaste = () => {
    setError(null)
    setSuccess(false)
    navigator.clipboard.readText().then(
      (text) => {
        try {
          const parsed = JSON.parse(text) as unknown
          const result = validatePlanWithMeta(parsed)
          if (result.success) {
            setJsonText(JSON.stringify(result.data, null, 2))
            setError(null)
          } else {
            setError(result.errors.join('\n'))
          }
        } catch {
          setError('Invalid JSON in clipboard')
        }
      },
      () => setError('Could not read clipboard')
    )
  }

  return (
    <div className="bg-surface-container-low rounded-3xl p-6 mb-6 overflow-hidden border border-outline-variant/30">
      <h2 className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">
        Create plan
      </h2>
      <p className="text-on-surface-variant font-body text-sm mb-4">
        Upload a JSON file or paste PlanWithMeta JSON below. Valid plans appear in the plan selector.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload JSON file"
        data-testid="create-plan-file-input"
      />
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className={recording ? 'col-span-2' : ''}>
          <AIVoicePlanInput
            onResult={(json) => {
              setJsonText(json)
              setError(null)
            }}
            disabled={loading || (!recording && !!jsonText.trim())}
            onRecordingChange={setRecording}
          />
        </div>
        {!recording && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={btnBase}
              data-testid="create-plan-upload-button"
            >
              <span className="material-symbols-outlined text-xl" aria-hidden>
                upload_file
              </span>
              Upload JSON
            </button>

            <button
              type="button"
              onClick={handlePaste}
              className={btnBase}
              data-testid="create-plan-paste-button"
            >
              <span className="material-symbols-outlined text-xl" aria-hidden>
                content_paste
              </span>
              Paste
            </button>

            <button
              type="button"
              onClick={() => {
                setJsonText('')
                setError(null)
              }}
              disabled={!jsonText.trim()}
              className={`${btnBase} disabled:opacity-50 disabled:cursor-not-allowed`}
              data-testid="create-plan-clear-button"
              aria-label="Clear JSON"
            >
              <span className="material-symbols-outlined text-xl" aria-hidden>
                delete_sweep
              </span>
              Clear
            </button>

          </>
        )}
      </div>

      <textarea
        value={jsonText}
        onChange={(e) => {
          setJsonText(e.target.value)
          setError(null)
        }}
        placeholder='{"id": "my-plan", "name": "My Plan", "days": [...]}'
        className="w-full h-40 px-4 py-3 rounded-xl border-2 border-outline-variant/60 bg-surface-container-low/50 text-on-surface font-mono text-sm resize-y focus:border-primary focus:outline-none placeholder:text-on-surface-variant/50"
        aria-label="Plan JSON"
        data-testid="create-plan-json-textarea"
      />

      {error && (
        <div className="mt-3 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-body">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-body" data-testid="create-plan-success">
          Plan created successfully. It should appear in the plan selector above.
        </div>
      )}

      <button
        type="button"
        onClick={handleCreate}
        disabled={!jsonText.trim() || loading}
        className="w-full h-12 mt-4 rounded-xl border-2 border-primary bg-primary/20 hover:bg-primary/30 font-headline font-bold text-primary text-base flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="create-plan-create-button"
      >
        {loading ? (
          <>
            <span className="material-symbols-outlined animate-spin text-xl" aria-hidden>
              progress_activity
            </span>
            Creating…
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-xl" aria-hidden>
              save
            </span>
            Create plan
          </>
        )}
      </button>
    </div>
  )
}
