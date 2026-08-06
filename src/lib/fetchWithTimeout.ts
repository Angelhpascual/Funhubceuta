const DEFAULT_TIMEOUT_MS = 10_000

export function fetchWithTimeout(
  url: string | URL,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  })
}
