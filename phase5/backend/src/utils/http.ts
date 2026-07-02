import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

const DEFAULT_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
};

const client = axios.create({
  timeout: 15000,
  headers: DEFAULT_HEADERS,
});

export const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

export async function fetchWithRetry(
  url: string,
  config: AxiosRequestConfig = {},
  retries = 3
): Promise<AxiosResponse> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await client.get(url, config);
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const wait = 1000 * Math.pow(2, attempt) + Math.random() * 500;
        console.warn(
          `[http] Retry ${attempt + 1}/${retries} for ${url} in ${Math.round(wait)}ms`
        );
        await sleep(wait);
      }
    }
  }
  throw lastErr;
}
