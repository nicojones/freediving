'use client';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import type { PlanWithMeta } from '../../types/plan';

function planToJson(plan: PlanWithMeta): string {
  return JSON.stringify(
    { id: plan.id, name: plan.name, description: plan.description, days: plan.days },
    null,
    2
  );
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9\-_]/gi, '_') + '.json';
}

interface PlanContextMenuProps {
  plan: PlanWithMeta;
  deleteDisabled: boolean;
  onRequestDelete: (e: React.MouseEvent, planId: string, planName: string) => void;
  onRequestEdit?: (e: React.MouseEvent, plan: PlanWithMeta) => void;
  onCopyError?: (msg: string) => void;
}

export function PlanContextMenu({
  plan,
  deleteDisabled,
  onRequestDelete,
  onRequestEdit,
  onCopyError,
}: PlanContextMenuProps) {
  const handleCopyJson = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(planToJson(plan));
    } catch {
      onCopyError?.('Could not copy to clipboard');
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([planToJson(plan)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sanitizeFilename(plan.name);
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRequestEdit) {
      onRequestEdit(e, plan);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    onRequestDelete(e, plan.id, plan.name);
  };

  return (
    <Menu>
      <MenuButton
        onClick={(e) => e.stopPropagation()}
        className="p-1 rounded-lg hover:bg-surface-variant/50 transition-colors"
        data-testid={`plan-menu-${plan.id}`}
        aria-label={`Options for ${plan.name}`}
      >
        <span className="material-symbols-outlined text-base">more_vert</span>
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="z-50 mt-1 min-w-40 rounded-xl border border-outline-variant/40 bg-surface-container-high shadow-lg py-1"
      >
        <MenuItem>
          <button
            type="button"
            onClick={handleCopyJson}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-variant/50 data-focus:bg-surface-variant/50"
            data-testid="plan-menu-copy"
          >
            Copy JSON
          </button>
        </MenuItem>
        <MenuItem>
          <button
            type="button"
            onClick={handleDownload}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-variant/50 data-focus:bg-surface-variant/50"
            data-testid="plan-menu-download"
          >
            Download plan
          </button>
        </MenuItem>
        <MenuItem>
          <button
            type="button"
            onClick={handleEdit}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-variant/50 data-focus:bg-surface-variant/50"
            data-testid="plan-menu-edit"
          >
            Edit
          </button>
        </MenuItem>
        <MenuItem disabled={deleteDisabled}>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteDisabled}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-error hover:bg-error/10 data-focus:bg-error/10 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="plan-menu-delete"
          >
            Delete
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
