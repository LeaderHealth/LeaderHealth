export function savedPromosStillAssigned(saved: readonly string[], assignedCodes: readonly string[]) {
  const assigned = new Map<string, string>();
  for (const code of assignedCodes) {
    const trimmed = code.trim();
    const key = trimmed.toLowerCase();
    if (key && !assigned.has(key)) assigned.set(key, trimmed);
  }
  const kept: string[] = [];
  const seen = new Set<string>();
  for (const item of saved) {
    const match = assigned.get(item.trim().toLowerCase());
    if (!match || seen.has(match.toLowerCase())) continue;
    seen.add(match.toLowerCase());
    kept.push(match);
  }
  return kept;
}
