'use client';

interface CreatePlanStatusBannerProps {
  error?: string | null;
  success?: boolean;
}

export function CreatePlanStatusBanner({ error, success }: CreatePlanStatusBannerProps) {
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
        className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-body"
        data-testid="create-plan-success"
      >
        Plan created successfully. It should appear in the plan selector above.
      </div>
    );
  }
  return null;
}
