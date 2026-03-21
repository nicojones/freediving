/**
 * In-memory sliding window rate limiter.
 * Keyed by IP. 5 attempts per 15 minutes.
 * Prunes old entries on check.
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const attempts = new Map<string, number[]>();

function prune(timestamps: number[]): number[] {
  const cutoff = Date.now() - WINDOW_MS;
  return timestamps.filter((t) => t > cutoff);
}

export function checkLimit(ip: string): boolean {
  const timestamps = attempts.get(ip) ?? [];
  const pruned = prune(timestamps);
  if (pruned.length > 0) {
    attempts.set(ip, pruned);
  } else {
    attempts.delete(ip);
  }
  return pruned.length < MAX_ATTEMPTS;
}

export function recordAttempt(ip: string): void {
  const timestamps = attempts.get(ip) ?? [];
  const pruned = prune(timestamps);
  pruned.push(Date.now());
  attempts.set(ip, pruned);
}
