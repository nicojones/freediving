/** Returns "Hold" or first word of label for timeline items */
export function formatPhaseShortLabel(item: {
  type: string
  label: string
}): string {
  return item.type === 'hold' ? 'Hold' : item.label.split(' ')[0]
}

/** Returns "Hold" or "Holds" based on count */
export function pluralizeHolds(count: number): string {
  return count === 1 ? 'Hold' : 'Holds'
}

/** Display label for timer phase */
export function formatPhaseDisplayName(phase: string | undefined): string {
  switch (phase) {
    case 'hold':
      return 'Holding'
    case 'recovery':
      return 'Recovery'
    case 'relaxation':
      return 'Prepare'
    case 'complete':
      return 'Complete'
    default:
      return 'Complete'
  }
}
