import assert from "node:assert/strict";
import { test } from "node:test";
import { createContactHandler } from "../src/lib/contact/handler.ts";

const validContactMessage = {
  name: "  Alex Rivera  ",
  email: "ALEX@example.com",
  phone: "+1 (212) 555-0148",
  subject: "A question about the menu",
  message: "Could you tell me more about your seasonal dishes?",
};

function createRequest(payload) {
  return new Request("http://localhost/api/contact", {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

test("valid contact messages are persisted and return a receipt", async () => {
  let persisted;
  const handler = createContactHandler(async (contactMessage) => {
    persisted = contactMessage;
  });

  const response = await handler(createRequest(validContactMessage));
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.deepEqual(persisted, {
    name: "Alex Rivera",
    email: "alex@example.com",
    phone: "+1 (212) 555-0148",
    subject: "A question about the menu",
    message: "Could you tell me more about your seasonal dishes?",
  });
  assert.deepEqual(body.contactMessage, {
    status: "new",
    received: true,
  });
  assert.equal(JSON.stringify(body).includes("alex@example.com"), false);
});

test("invalid email is rejected", async () => {
  const handler = createContactHandler(async () => {});
  const response = await handler(
    createRequest({ ...validContactMessage, email: "not-an-email" }),
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.match(body.error.fieldErrors.email, /email/i);
});

test("missing required fields return field-specific errors", async () => {
  const handler = createContactHandler(async () => {});
  const response = await handler(createRequest({}));
  const body = await response.json();

  assert.equal(response.status, 400);
  for (const field of ["name", "email", "phone", "subject", "message"]) {
    assert.equal(typeof body.error.fieldErrors[field], "string");
  }
});

test("database failures return a sanitized response", async () => {
  const handler = createContactHandler(async () => {
    throw new Error("private database connection detail");
  });
  const response = await handler(createRequest(validContactMessage));
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.match(body.error.message, /try again/i);
  assert.equal(JSON.stringify(body).includes("private database"), false);
});
