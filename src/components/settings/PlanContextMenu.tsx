'use client';

import { useCallback, useMemo } from 'react';
import type { PlanWithMeta } from '../../types/plan';
import { planToJson } from '../../utils/planExport';
import { ContextMenu, type ContextMenuItem } from '../ui/ContextMenu';

const sanitizeFilename = (name: string): string => name.replace(/[^a-z0-9\-_]/gi, '_') + '.json';

interface PlanContextMenuProps {
  plan: PlanWithMeta;
  deleteDisabled: boolean;
  onRequestDelete: (e: React.MouseEvent, planId: string, planName: string) => void;
  onRequestEdit?: (e: React.MouseEvent, plan: PlanWithMeta) => void;
  onRequestReset?: (e: React.MouseEvent, plan: PlanWithMeta) => void;
  onCopyError?: (msg: string) => void;
  /** When false, only Copy and Download are shown (e.g. for bundled plans). Default true. */
  showEditResetDelete?: boolean;
}

export const PlanContextMenu = ({
  plan,
  deleteDisabled,
  onRequestDelete,
  onRequestEdit,
  onRequestReset,
  onCopyError,
  showEditResetDelete = true,
}: PlanContextMenuProps) => {
  const handleCopyJson = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(planToJson(plan));
      } catch {
        onCopyError?.('Could not copy to clipboard');
      }
    },
    [plan, onCopyError]
  );

  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const blob = new Blob([planToJson(plan)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = sanitizeFilename(plan.name);
      a.click();
      URL.revokeObjectURL(url);
    },
    [plan]
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRequestEdit?.(e, plan);
    },
    [plan, onRequestEdit]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      onRequestDelete(e, plan.id, plan.name);
    },
    [plan, onRequestDelete]
  );

  const handleReset = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRequestReset?.(e, plan);
    },
    [plan, onRequestReset]
  );

  const items = useMemo<ContextMenuItem[]>(
    () => [
      ...(showEditResetDelete
        ? [
            {
              key: 'edit',
              label: 'Edit',
              onClick: handleEdit,
              icon: 'edit',
              'data-testid': 'plan-menu-edit',
            } satisfies ContextMenuItem,
          ]
        : []),
      {
        key: 'copy',
        label: 'Copy JSON',
        onClick: handleCopyJson,
        icon: 'content_copy',
        'data-testid': 'plan-menu-copy',
      },
      {
        key: 'download',
        label: 'Download plan',
        onClick: handleDownload,
        icon: 'download',
        'data-testid': 'plan-menu-download',
      },
      ...(showEditResetDelete && onRequestReset
        ? [
            {
              key: 'reset',
              label: 'Reset progress',
              onClick: handleReset,
              danger: true,
              icon: 'restart_alt',
              'data-testid': 'reset-progress-button',
            } satisfies ContextMenuItem,
          ]
        : []),
      ...(showEditResetDelete
        ? [
            {
              key: 'delete',
              label: 'Delete',
              onClick: handleDelete,
              danger: true,
              icon: 'delete',
              disabled: deleteDisabled,
              'data-testid': 'plan-menu-delete',
            } satisfies ContextMenuItem,
          ]
        : []),
    ],
    [
      showEditResetDelete,
      onRequestReset,
      deleteDisabled,
      handleEdit,
      handleCopyJson,
      handleDownload,
      handleReset,
      handleDelete,
    ]
  );

  return (
    <ContextMenu
      items={items}
      triggerTestId={`plan-menu-${plan.id}`}
      triggerLabel={`Options for ${plan.name}`}
    />
  );
};
