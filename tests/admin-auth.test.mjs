import assert from "node:assert/strict";
import { test } from "node:test";
import { createAdminAuthorizer } from "../src/lib/admin/authorization.ts";
import { createAdminLoginHandler } from "../src/lib/admin/login-handler.ts";

const validLogin = {
  email: "ADMIN@example.com",
  password: "correct horse battery staple",
};

function request(body) {
  return new Request("http://localhost/api/admin/login", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

test("admin login rejects invalid email and missing credentials", async () => {
  let signInCalled = false;
  const handler = createAdminLoginHandler({
    signIn: async () => {
      signInCalled = true;
      return null;
    },
    isAdministrator: async () => false,
    signOut: async () => {},
  });

  const response = await handler(request({ email: "bad", password: "" }));
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(typeof body.error.fieldErrors.email, "object");
  assert.equal(signInCalled, false);
});

test("login is denied and the session cleared for a non-admin account", async () => {
  let signedOut = false;
  const handler = createAdminLoginHandler({
    signIn: async (email) => ({ id: "user-1", email }),
    isAdministrator: async () => false,
    signOut: async () => {
      signedOut = true;
    },
  });

  const response = await handler(request(validLogin));

  assert.equal(response.status, 403);
  assert.equal(signedOut, true);
});

test("an allowlisted account can log in without receiving session tokens in JSON", async () => {
  const handler = createAdminLoginHandler({
    signIn: async (email) => ({ id: "admin-1", email }),
    isAdministrator: async (userId) => userId === "admin-1",
    signOut: async () => {},
  });

  const response = await handler(request(validLogin));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { user: { email: "admin@example.com" } });
  assert.equal(JSON.stringify(body).includes("access_token"), false);
});

test("protected pages reject unauthenticated and non-allowlisted users server-side", async () => {
  const unauthenticated = createAdminAuthorizer(
    async () => null,
    async () => true,
  );
  const unlisted = createAdminAuthorizer(
    async () => ({ id: "customer-1", email: "guest@example.com" }),
    async () => false,
  );

  assert.deepEqual(await unauthenticated(), { status: "unauthenticated" });
  assert.deepEqual(await unlisted(), { status: "forbidden" });
});

test("database authorization failures do not grant access", async () => {
  const authorize = createAdminAuthorizer(
    async () => ({ id: "admin-1", email: "admin@example.com" }),
    async () => {
      throw new Error("database detail");
    },
  );

  assert.deepEqual(await authorize(), { status: "unavailable" });
});
