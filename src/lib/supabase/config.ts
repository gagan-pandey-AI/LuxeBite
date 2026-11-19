const SUPABASE_URL_ENV = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_PUBLIC_KEY_ENV = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

export function isSupabasePlaceholder(value: string) {
  return (
    /^(?:replace[_ -]?with|your[-_ ]|placeholder\b|<)/i.test(value) ||
    /^https?:\/\/your-project\.supabase\.co\/?$/i.test(value)
  );
}

export function isValidSupabaseUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function getSupabasePublicConfigurationIssue() {
  const url = process.env[SUPABASE_URL_ENV]?.trim();
  const publicKey = process.env[SUPABASE_PUBLIC_KEY_ENV]?.trim();
  const issues: string[] = [];

  if (!url || isSupabasePlaceholder(url)) {
    issues.push(`${SUPABASE_URL_ENV} is missing or still a placeholder.`);
  } else if (!isValidSupabaseUrl(url)) {
    issues.push(`${SUPABASE_URL_ENV} must be a valid HTTP(S) URL.`);
  }

  if (!publicKey || isSupabasePlaceholder(publicKey)) {
    issues.push(`${SUPABASE_PUBLIC_KEY_ENV} is missing or still a placeholder.`);
  }

  return issues.length
    ? `Supabase authentication is unavailable. ${issues.join(" ")}`
    : null;
}

export function getSupabasePublicConfig() {
  if (getSupabasePublicConfigurationIssue()) {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  return url && anonKey ? { url, anonKey } : null;
}
