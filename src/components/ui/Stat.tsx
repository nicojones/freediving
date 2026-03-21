import clsx from 'clsx';

const LABEL_BASE = 'text-on-surface-variant font-label uppercase tracking-[0.2em] block';

interface StatProps {
  label: string;
  value: React.ReactNode;
  variant?: 'large' | 'compact';
  valueClassName?: string;
  icon?: string;
}

export function Stat({
  label,
  value,
  variant = 'compact',
  valueClassName = 'text-on-surface',
  icon,
}: StatProps) {
  const isLarge = variant === 'large';

  return (
    <div
      className={clsx(
        'bg-surface-container-low rounded-xl flex flex-col justify-between relative overflow-hidden',
        {
          'col-span-2 p-6 h-40 group': isLarge,
          'p-5': !isLarge,
        }
      )}
    >
      <div className={clsx({ 'relative z-10': isLarge })}>
        <span
          className={clsx(LABEL_BASE, {
            'text-xs': isLarge,
            'text-[10px] mb-2': !isLarge,
          })}
        >
          {label}
        </span>
        <div
          className={clsx('font-headline font-bold mt-2', valueClassName, {
            'text-5xl font-extrabold': isLarge,
            'text-2xl': !isLarge,
          })}
        >
          {value}
        </div>
      </div>
      {icon && (
        <div className="absolute right-0 -bottom-4 opacity-5 transition-opacity duration-700">
          <span className="material-symbols-outlined text-[120px]">{icon}</span>
        </div>
      )}
    </div>
  );
}
