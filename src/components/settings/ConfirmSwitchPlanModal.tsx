import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

interface ConfirmSwitchPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  planName: string;
}

export const ConfirmSwitchPlanModal = ({
  isOpen,
  onClose,
  onConfirm,
  planName,
}: ConfirmSwitchPlanModalProps) => {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 flex items-center justify-center p-4 bg-black/60"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          data-testid="confirm-switch-plan-modal"
          className="bg-surface-container-low rounded-3xl p-6 max-w-md w-full border border-outline-variant/30 shadow-xl"
        >
          <DialogTitle
            id="confirm-switch-plan-title"
            className="font-headline text-xl font-bold text-on-surface mb-2"
          >
            Switch training plan
          </DialogTitle>
          <p className="text-on-surface-variant font-body text-sm mb-4">
            Switch to {planName}? Your progress in both plans will be preserved.
          </p>
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
              data-testid="confirm-switch-plan-confirm"
              onClick={handleConfirm}
              className="flex-1 h-12 rounded-xl border-2 border-primary/50 bg-primary/10 hover:bg-primary/20 font-headline font-bold text-primary text-base transition-all duration-300 active:scale-[0.98]"
            >
              Confirm
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
