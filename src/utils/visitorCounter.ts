export const VISITOR_COUNT_KEY = 'catabooth_visitor_count'
const INITIAL_VISITOR_COUNT = 128
let sessionCount = INITIAL_VISITOR_COUNT
let persistenceFailed = false

/** Local adapter: replace these two operations when the backend counter is ready. */
export function readVisitorCount(): number {
  if (persistenceFailed) return sessionCount
  try {
    const saved = window.localStorage.getItem(VISITOR_COUNT_KEY)
    const value = saved !== null && /^\d+$/.test(saved) ? Number(saved) : NaN
    sessionCount = Number.isSafeInteger(value) && value >= INITIAL_VISITOR_COUNT && value < Number.MAX_SAFE_INTEGER
      ? value
      : INITIAL_VISITOR_COUNT
  } catch {
    persistenceFailed = true
    // Storage may be unavailable in private/embedded contexts. Keep the booth usable.
  }
  return sessionCount
}

export function incrementVisitorCount(): number {
  const count = readVisitorCount() + 1
  sessionCount = count
  try {
    window.localStorage.setItem(VISITOR_COUNT_KEY, String(count))
    persistenceFailed = false
  } catch {
    persistenceFailed = true
    // Retain the count for this session when persistence is unavailable.
  }
  return count
}
