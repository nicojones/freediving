const DEFAULT_CIRCUMFERENCE = 2 * Math.PI * 160

/**
 * Computes SVG strokeDasharray for circular hold progress.
 * @param remainingMs - remaining time in milliseconds
 * @param totalDurationSeconds - total hold duration in seconds
 * @param circumference - SVG circle circumference (default ~1005 for r=160)
 */
export function getHoldProgressDashArray(
  remainingMs: number,
  totalDurationSeconds: number,
  circumference = DEFAULT_CIRCUMFERENCE
): string {
  if (totalDurationSeconds <= 0) {return `0 ${circumference}`}
  const progressRatio = remainingMs / 1000 / totalDurationSeconds
  const filled = progressRatio * circumference
  return `${filled} ${circumference}`
}
