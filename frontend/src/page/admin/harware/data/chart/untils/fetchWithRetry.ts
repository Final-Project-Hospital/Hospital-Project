// utils/fetchWithRetry.ts
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = 5,
  interval = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await fn();
      if (Array.isArray(result) && result.length === 0) throw new Error("No data, retry");
      return result;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((res) => setTimeout(res, interval));
    }
  }
  throw new Error("Max retries reached");
}
