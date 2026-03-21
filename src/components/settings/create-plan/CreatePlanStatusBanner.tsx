'use client';

interface CreatePlanStatusBannerProps {
  error?: string | null;
  success?: boolean;
  onNavigateToPlans?: () => void;
}

export const CreatePlanStatusBanner = ({
  error,
  success,
  onNavigateToPlans,
}: CreatePlanStatusBannerProps) => {
  if (error) {
    return (
      <div
        className="mt-3 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-body"
        data-testid="create-plan-error"
      >
        {error}
      </div>
    );
  }
  if (success) {
    return (
      <div
        className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-body flex flex-col gap-2"
        data-testid="create-plan-success"
      >
        <span>See plans here</span>
        {onNavigateToPlans && (
          <button
            type="button"
            onClick={onNavigateToPlans}
            className="w-full py-2 rounded-lg bg-primary/20 hover:bg-primary/30 font-headline font-bold text-primary"
            data-testid="create-plan-go-to-plans"
          >
            Go to Plans
          </button>
        )}
      </div>
    );
  }
  return null;
};
