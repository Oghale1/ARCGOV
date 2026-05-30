// ArcGov — arcgov.vercel.app
// Small helper: retry a flaky async call (like a network/RPC request) a few
// times before giving up. Useful because blockchain RPC endpoints sometimes
// fail the first time but succeed on a quick retry.

interface RetryOptions {
  /** How many total attempts (default 3). */
  attempts?: number;
  /** Base wait between attempts in ms; grows each time (default 400ms). */
  delayMs?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const delayMs = options.delayMs ?? 400;

  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // Don't wait after the final failed attempt.
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  throw lastError;
}
