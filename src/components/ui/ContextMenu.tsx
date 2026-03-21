'use client';

import clsx from 'clsx';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

export interface ContextMenuItem {
  key: string;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
  icon?: string;
  disabled?: boolean;
  'data-testid'?: string;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  trigger?: React.ReactNode;
  triggerClassName?: string;
  triggerTestId?: string;
  triggerLabel?: string;
  menuAnchor?: 'bottom end' | 'bottom start' | 'top end' | 'top start';
  menuClassName?: string;
}

const ITEM_BASE =
  'flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-surface-variant/50 data-focus:bg-surface-variant/50';
const ITEM_DANGER = 'text-error hover:bg-error/10 data-focus:bg-error/10';
const ITEM_DISABLED = 'opacity-50 cursor-not-allowed';

export const ContextMenu = ({
  items,
  trigger,
  triggerClassName = 'p-1 rounded-lg hover:bg-surface-variant/50 transition-colors',
  triggerTestId,
  triggerLabel,
  menuAnchor = 'bottom end',
  menuClassName = 'z-50 mt-1 min-w-40 rounded-xl border border-outline-variant/40 bg-surface-container-high shadow-lg py-1',
}: ContextMenuProps) => {
  return (
    <Menu>
      <MenuButton
        onClick={(e) => e.stopPropagation()}
        className={triggerClassName}
        data-testid={triggerTestId}
        aria-label={triggerLabel}
      >
        {trigger ?? (
          <span className="material-symbols-outlined text-base" aria-hidden>
            more_vert
          </span>
        )}
      </MenuButton>
      <MenuItems anchor={menuAnchor} className={menuClassName}>
        {items.map((item) => (
          <MenuItem key={item.key} disabled={item.disabled}>
            <button
              type="button"
              onClick={item.onClick}
              disabled={item.disabled}
              className={clsx(
                ITEM_BASE,
                { [ITEM_DANGER]: item.danger, [ITEM_DISABLED]: item.disabled },
                !item.danger && 'text-on-surface'
              )}
              data-testid={item['data-testid']}
            >
              {item.icon && (
                <span className="material-symbols-outlined text-xl" aria-hidden>
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
};
