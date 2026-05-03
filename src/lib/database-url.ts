const SSL_MODE_ALIASES = new Set(["prefer", "require", "verify-ca"]);

export function normalizeDatabaseUrl(databaseUrl: string | undefined): string | undefined {
  if (!databaseUrl) {
    return databaseUrl;
  }

  let url: URL;

  try {
    url = new URL(databaseUrl);
  } catch {
    return databaseUrl;
  }

  const sslMode = url.searchParams.get("sslmode");
  const useLibpqCompat = url.searchParams.get("uselibpqcompat");

  if (!sslMode || useLibpqCompat === "true" || !SSL_MODE_ALIASES.has(sslMode)) {
    return databaseUrl;
  }

  url.searchParams.set("sslmode", "verify-full");
  return url.toString();
}
