'use client';

import { Radio, RadioGroup } from '@headlessui/react';
import clsx from 'clsx';

export type PlanFilter = 'all' | 'my' | 'public';

const RADIO_BTN_CLASS = clsx(
  'px-4 py-2 rounded-xl font-label font-semibold transition-colors duration-400 cursor-pointer',
  'data-checked:bg-primary data-checked:text-on-primary',
  'data-[checked=false]:bg-surface-container-high data-[checked=false]:text-on-surface-variant',
  'hover:bg-surface-variant',
  'flex items-center gap-2'
);

interface PlanFilterRadioProps {
  value: PlanFilter;
  onChange: (value: PlanFilter) => void;
}

export const PlanFilterRadio = ({ value, onChange }: PlanFilterRadioProps) => (
  <RadioGroup
    value={value}
    onChange={onChange}
    className="mb-4"
    data-testid="plan-filter"
    aria-label="Filter plans"
  >
    <div className="flex gap-2">
      <Radio value="all" data-testid="plan-filter-all" className={RADIO_BTN_CLASS}>
        All
      </Radio>
      <Radio value="my" data-testid="plan-filter-my" className={RADIO_BTN_CLASS}>
        <span className="material-symbols-outlined text-base" aria-hidden>
          person
        </span>
        Mine
      </Radio>
      <Radio value="public" data-testid="plan-filter-public" className={RADIO_BTN_CLASS}>
        <span className="material-symbols-outlined text-base" aria-hidden>
          public
        </span>
        Public
      </Radio>
    </div>
  </RadioGroup>
);
