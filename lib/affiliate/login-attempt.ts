export const LOGIN_FAIL_LIMIT = 5;
export const LOGIN_LOCK_MS = 5 * 60 * 1000;

export type LoginAttempt = {
  failures: number;
  lockedUntil: number | null;
};

export function nextLoginAttempt(current: LoginAttempt | null, now: number): LoginAttempt {
  if (current?.lockedUntil != null && current.lockedUntil > now) {
    return { failures: current.failures, lockedUntil: current.lockedUntil };
  }
  const expired = current?.lockedUntil != null && current.lockedUntil <= now;
  const previous = !current || expired ? 0 : current.failures;
  const failures = previous + 1;
  if (failures >= LOGIN_FAIL_LIMIT) {
    return { failures: LOGIN_FAIL_LIMIT, lockedUntil: now + LOGIN_LOCK_MS };
  }
  return { failures, lockedUntil: null };
}
