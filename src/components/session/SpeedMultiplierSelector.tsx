import { memo } from 'react';
import { Radio, RadioGroup } from '@headlessui/react';
import { SPEEDS } from '../../constants/test';

interface SpeedMultiplierSelectorProps {
  value: number;
  onChange: (speed: number) => void;
  label?: string;
}

export const SpeedMultiplierSelector = memo(function SpeedMultiplierSelector({
  value,
  onChange,
}: SpeedMultiplierSelectorProps) {
  return (
    <section data-testid="speed-selector" className="mb-8 w-full overflow-x-auto">
      <RadioGroup value={value} onChange={onChange}>
        <div className="flex gap-2">
          {SPEEDS.map((speed) => (
            <Radio
              key={speed}
              value={speed}
              data-testid="speed-option"
              data-testid-value={String(speed)}
              className="px-4 py-2 rounded-xl font-label font-semibold transition-colors duration-400 cursor-pointer data-checked:bg-primary data-checked:text-on-primary data-[checked=false]:bg-surface-container-high data-[checked=false]:text-on-surface-variant hover:bg-surface-variant"
            >
              {speed}×
            </Radio>
          ))}
        </div>
      </RadioGroup>
    </section>
  );
});
