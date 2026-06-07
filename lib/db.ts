import { neon, neonConfig, type NeonQueryFunction } from "@neondatabase/serverless";
import ws from "ws";

type Sql = NeonQueryFunction<false, false>;

const globalForDb = globalThis as typeof globalThis & {
  __foodAppSql?: Sql;
  __foodAppDbConfigured?: boolean;
};

function normalizeDatabaseUrl(url: string): string {
  const parsed = new URL(url);
  parsed.searchParams.delete("channel_binding");
  return parsed.toString();
}

function configureNeonDriver() {
  if (globalForDb.__foodAppDbConfigured) return;
  globalForDb.__foodAppDbConfigured = true;

  if (typeof window === "undefined" && typeof process !== "undefined" && process.versions?.node) {
    neonConfig.webSocketConstructor = ws;
  }
}

export function getSql(): Sql {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  configureNeonDriver();

  if (!globalForDb.__foodAppSql) {
    globalForDb.__foodAppSql = neon(normalizeDatabaseUrl(rawUrl));
  }

  return globalForDb.__foodAppSql;
}

export async function withDbRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable =
        message.includes("fetch failed") ||
        message.includes("Connect Timeout") ||
        message.includes("ECONNRESET") ||
        message.includes("ETIMEDOUT");

      if (!retryable || attempt === retries - 1) break;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }

  throw lastError;
}
