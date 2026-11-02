import assert from "node:assert/strict";
import { test } from "node:test";
import { LOGIN_FAIL_LIMIT, LOGIN_LOCK_MS, nextLoginAttempt, type LoginAttempt } from "./login-attempt.ts";

const start = Date.parse("2026-11-02T18:00:00.000Z");

function failures(count: number): LoginAttempt {
  let attempt: LoginAttempt | null = null;
  for (let i = 0; i < count; i += 1) attempt = nextLoginAttempt(attempt, start);
  if (!attempt) throw new Error("expected an attempt");
  return attempt;
}

test("four wrong passwords stay unlocked", () => {
  const attempt = failures(4);
  assert.equal(attempt.failures, 4);
  assert.equal(attempt.lockedUntil, null);
  assert.ok(attempt.failures < LOGIN_FAIL_LIMIT);
});

test("the fifth wrong password locks for 5 minutes", () => {
  const attempt = nextLoginAttempt(failures(4), start);
  assert.equal(attempt.failures, LOGIN_FAIL_LIMIT);
  assert.equal(attempt.lockedUntil, start + LOGIN_LOCK_MS);
});

test("another failure during the lock does not extend it", () => {
  const locked = nextLoginAttempt(failures(4), start);
  const again = nextLoginAttempt(locked, start + 60 * 1000);
  assert.equal(again.lockedUntil, locked.lockedUntil);
  assert.equal(again.failures, locked.failures);
});

test("an expired lock starts again at 1", () => {
  const locked = nextLoginAttempt(failures(4), start);
  const next = nextLoginAttempt(locked, start + LOGIN_LOCK_MS);
  assert.equal(next.failures, 1);
  assert.equal(next.lockedUntil, null);
});
