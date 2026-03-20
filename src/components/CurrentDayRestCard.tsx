import { memo } from 'react'

interface CurrentDayRestCardProps {
  dayIndex: number
  dayId: string
}

export const CurrentDayRestCard = memo(function CurrentDayRestCard({
  dayIndex,
  dayId,
}: CurrentDayRestCardProps) {
  return (
    <div data-testid={`day-card-${dayId}`} className="relative group w-full text-left">
      <div className="absolute -inset-1 bg-primary/10 blur-xl rounded-full opacity-50 transition duration-1000" />
      <div className="relative bg-surface-container-high border-2 border-primary/20 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="bg-primary/20 text-primary font-label text-[10px] px-3 py-1 rounded-full uppercase font-black tracking-widest mb-3 inline-block">
                Current
              </span>
              <h3 className="font-headline font-bold text-3xl text-on-surface">
                Day {dayIndex + 1}
              </h3>
              <p className="font-body text-sm text-on-surface-variant mt-1">
                Rest day — recovery and light activity
              </p>
            </div>
            <span className="material-symbols-outlined text-secondary text-3xl">
              self_improvement
            </span>
          </div>
          <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
            <div className="h-full bg-primary w-0 rounded-full" />
          </div>
          <div className="h-24 w-full rounded-xl bg-secondary/20 border-2 border-secondary/30 flex items-center justify-center gap-3 pointer-events-none">
            <span className="material-symbols-outlined text-secondary">
              bed
            </span>
            <span className="text-secondary font-headline text-xl font-bold">
              Take a rest day today
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})
