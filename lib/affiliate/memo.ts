const fresh = new Map<string, { at: number; value: unknown }>();
const pending = new Map<string, Promise<unknown>>();
const ttlMs = 20_000;

export function memo<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = fresh.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return Promise.resolve(hit.value as T);
  const existing = pending.get(key);
  if (existing) return existing as Promise<T>;
  const next = load().then(
    (value) => {
      fresh.set(key, { at: Date.now(), value });
      pending.delete(key);
      return value;
    },
    (error) => {
      pending.delete(key);
      throw error;
    },
  );
  pending.set(key, next);
  return next;
}

export function clearAffiliateMemo() {
  fresh.clear();
  pending.clear();
}
