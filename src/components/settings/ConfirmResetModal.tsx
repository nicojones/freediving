import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

interface ConfirmResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: React.ReactNode;
  /** Word user must type to confirm; defaults to 'reset' */
  confirmWord?: string;
}

export function ConfirmResetModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmWord = 'reset',
}: ConfirmResetModalProps) {
  const [confirmInput, setConfirmInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConfirmInput('');
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (confirmInput.toLowerCase() !== confirmWord.toLowerCase()) {
      return;
    }
    onClose();
    await onConfirm();
  };

  const canConfirm = confirmInput.toLowerCase() === confirmWord.toLowerCase();

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 flex items-center justify-center p-4 bg-black/60"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-surface-container-low rounded-3xl p-6 max-w-md w-full border border-outline-variant/30 shadow-xl">
          <DialogTitle
            id="confirm-reset-title"
            className="font-headline text-xl font-bold text-on-surface mb-2"
          >
            {title}
          </DialogTitle>
          <p className="text-on-surface-variant font-body text-sm mb-4">{message}</p>
          <input
            type="text"
            data-testid="confirm-reset-input"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={`Type '${confirmWord}' to confirm`}
            className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant/60 bg-surface-container-low/50 text-on-surface font-body text-base focus:border-primary focus:outline-none mb-4"
            aria-label={`Type ${confirmWord} to confirm`}
            autoComplete="off"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border-2 border-outline-variant/60 bg-surface-container-low/50 hover:bg-surface-container-low font-headline font-bold text-on-surface text-base transition-all duration-300 active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="confirm-reset-confirm"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="flex-1 h-12 rounded-xl border-2 border-error/50 bg-error/10 hover:bg-error/20 disabled:opacity-50 disabled:cursor-not-allowed font-headline font-bold text-error text-base transition-all duration-300 active:scale-[0.98] disabled:active:scale-100"
            >
              Confirm
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
