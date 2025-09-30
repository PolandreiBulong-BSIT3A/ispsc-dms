// Shared fetch helper with simple retry for 429 Too Many Requests and transient network errors
export async function fetchWithRetry(url, options = {}, attempts = 3, backoffMs = 800) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status !== 429 && res.status !== 503) return res;
      // fallthrough to retry on 429/503
    } catch (err) {
      // Save error and retry
      lastErr = err;
    }
    if (i < attempts - 1) {
      await new Promise(r => setTimeout(r, backoffMs * (i + 1)));
    }
  }
  if (lastErr) throw lastErr;
  // One last attempt without catching to surface error body
  return await fetch(url, options);
}
