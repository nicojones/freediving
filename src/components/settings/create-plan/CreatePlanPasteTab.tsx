'use client';

import clsx from 'clsx';
import { CREATE_PLAN_BTN_BASE, CREATE_PLAN_BTN_PRIMARY, CREATE_PLAN_TEXTAREA } from './styles';

interface CreatePlanPasteTabProps {
  jsonText: string;
  setJsonText: (v: string) => void;
  loading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPaste: () => void;
  onClear: () => void;
  onCreate: () => void;
  onClearError: () => void;
}

export function CreatePlanPasteTab({
  jsonText,
  setJsonText,
  loading,
  fileInputRef,
  onFileSelect,
  onPaste,
  onClear,
  onCreate,
  onClearError,
}: CreatePlanPasteTabProps) {
  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={onFileSelect}
        className="hidden"
        aria-label="Upload JSON file"
        data-testid="create-plan-file-input"
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={CREATE_PLAN_BTN_BASE}
          data-testid="create-plan-upload-button"
        >
          <span className="material-symbols-outlined text-xl" aria-hidden>
            upload_file
          </span>
          Upload JSON
        </button>
        <button
          type="button"
          onClick={onPaste}
          className={CREATE_PLAN_BTN_BASE}
          data-testid="create-plan-paste-button"
        >
          <span className="material-symbols-outlined text-xl" aria-hidden>
            content_paste
          </span>
          Paste
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={!jsonText.trim()}
          className={clsx(CREATE_PLAN_BTN_BASE, 'disabled:opacity-50 disabled:cursor-not-allowed')}
          data-testid="create-plan-clear-button"
          aria-label="Clear JSON"
        >
          <span className="material-symbols-outlined text-xl" aria-hidden>
            delete_sweep
          </span>
          Clear
        </button>
      </div>
      <textarea
        value={jsonText}
        onChange={(e) => {
          setJsonText(e.target.value);
          onClearError();
        }}
        placeholder="Paste Plan JSON here"
        className={clsx(CREATE_PLAN_TEXTAREA, 'h-40 font-mono')}
        aria-label="Plan JSON"
        data-testid="create-plan-json-textarea"
      />
      <button
        type="button"
        onClick={onCreate}
        disabled={!jsonText.trim() || loading}
        className={clsx(CREATE_PLAN_BTN_PRIMARY, 'w-full')}
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
  );
}
