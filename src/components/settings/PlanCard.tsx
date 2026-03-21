'use client';

import clsx from 'clsx';
import type { PlanWithMeta } from '../../types/plan';
import { APP_NAME, CREATED_BY } from '../../constants/app';
import { PlanContextMenu } from './PlanContextMenu';

interface PlanCardProps {
  plan: PlanWithMeta;
  progress?: { completed: number; total: number };
  variant: 'active' | 'selectable';
  onClick: () => void;
  showMenu?: boolean;
  showPublicIcon?: boolean;
  deleteDisabled?: boolean;
  onRequestDelete?: (e: React.MouseEvent, planId: string, planName: string) => void;
  onRequestEdit?: (e: React.MouseEvent, plan: PlanWithMeta) => void;
  onCopyError?: (msg: string) => void;
  dataTestId?: string;
  progressTestId?: string;
  creatorTestId?: string;
}

export function PlanCard({
  plan,
  progress,
  variant,
  onClick,
  showMenu = false,
  showPublicIcon = false,
  deleteDisabled = false,
  onRequestDelete,
  onRequestEdit,
  onCopyError,
  dataTestId,
  progressTestId,
  creatorTestId,
}: PlanCardProps) {
  const content = (
    <>
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <div className={clsx('flex justify-between items-start gap-4')}>
          {progress && (
            <span className="subtle" data-testid={progressTestId}>
              {progress.completed}/{progress.total} days
            </span>
          )}
          {plan.public === true && (
            <span className="flex gap-x-2 items-center">
              {showPublicIcon && (
                <span
                  className="material-symbols-outlined text-on-surface-variant/60 text-base"
                  aria-label="Public plan"
                >
                  public
                </span>
              )}
              <span className="subtle" data-testid={creatorTestId}>
                {CREATED_BY} {plan.creator_name ?? APP_NAME}
              </span>
            </span>
          )}
        </div>
        <span className="font-body font-medium truncate min-w-0">{plan.name}</span>
        {plan.description && (
          <span className="text-on-surface-variant text-sm font-normal line-clamp-2">
            {plan.description}
          </span>
        )}
      </div>

      <div className="flex items-center shrink-0">
        {showMenu && onRequestDelete && (
          <PlanContextMenu
            plan={plan}
            deleteDisabled={deleteDisabled}
            onRequestDelete={onRequestDelete}
            onRequestEdit={onRequestEdit}
            onCopyError={onCopyError}
          />
        )}
        {variant === 'active' && !showMenu && !showPublicIcon && (
          <span className="material-symbols-outlined text-on-surface-variant shrink-0" aria-hidden>
            chevron_right
          </span>
        )}
      </div>
    </>
  );

  const baseClasses =
    'w-full flex items-start justify-between gap-4 px-5 py-4 text-left transition-colors cursor-pointer hover:bg-surface-container-high text-on-surface';

  if (variant === 'active') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={clsx(
          baseClasses,
          'rounded-xl border border-outline-variant/60 bg-surface-container-low/50'
        )}
        data-testid={dataTestId}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      data-testid={dataTestId}
      data-testid-value={plan.id}
      data-plan-name={plan.name}
      className={clsx(baseClasses, 'border-b border-outline-variant/20 last:border-0')}
    >
      {content}
    </div>
  );
}
