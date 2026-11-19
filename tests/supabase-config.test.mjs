import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  getSupabasePublicConfig,
  getSupabasePublicConfigurationIssue,
} from "../src/lib/supabase/config.ts";

const variableNames = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const originalValues = new Map(
  variableNames.map((name) => [name, process.env[name]]),
);

function clearSupabaseEnvironment() {
  for (const name of variableNames) {
    delete process.env[name];
  }
}

afterEach(() => {
  for (const name of variableNames) {
    const value = originalValues.get(name);
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
});

test("missing and placeholder public settings preserve the unconfigured fallback", () => {
  clearSupabaseEnvironment();
  process.env.NEXT_PUBLIC_SUPABASE_URL =
    "https://dqzsdgrtvxjvnshtnsnm.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
    "REPLACE_WITH_PUBLISHABLE_OR_LEGACY_ANON_KEY";

  assert.equal(getSupabasePublicConfig(), null);
  assert.match(
    getSupabasePublicConfigurationIssue(),
    /NEXT_PUBLIC_SUPABASE_ANON_KEY.*placeholder/i,
  );
});

test("public configuration accepts a publishable key without exposing a server key", () => {
  clearSupabaseEnvironment();
  process.env.NEXT_PUBLIC_SUPABASE_URL =
    "https://dqzsdgrtvxjvnshtnsnm.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_test_value";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test_value";

  assert.deepEqual(getSupabasePublicConfig(), {
    url: "https://dqzsdgrtvxjvnshtnsnm.supabase.co",
    anonKey: "sb_publishable_test_value",
  });
  assert.equal(
    JSON.stringify(getSupabasePublicConfig()).includes("sb_secret_test_value"),
    false,
  );
});

test("invalid project URLs return a non-secret configuration issue", () => {
  clearSupabaseEnvironment();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_test_value";

  assert.equal(getSupabasePublicConfig(), null);
  const issue = getSupabasePublicConfigurationIssue();
  assert.match(issue, /NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP\(S\) URL/i);
  assert.equal(issue.includes("not-a-url"), false);
});
