import assert from "node:assert/strict";
import { test } from "node:test";
import { createReservationHandler } from "../src/lib/reservations/handler.ts";
import { consumeReservationRequest } from "../src/lib/reservations/rate-limit.ts";

const fixedNow = () => new Date("2026-11-19T15:00:00.000Z");
const validReservation = {
  customerName: "  Alex Rivera  ",
  customerEmail: "ALEX@example.com",
  customerPhone: "+1 (212) 555-0148",
  reservationDate: "2026-11-20",
  reservationTime: "18:30",
  guestCount: 2,
  specialRequests: "  Window seat, if available.  ",
};

function createRequest(payload) {
  return new Request("http://localhost/api/reservations", {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

function createTestHandler(persistReservation = async () => {}) {
  return createReservationHandler(persistReservation, {
    createReference: () => "LB-261120-0123456789ABCDEF",
    now: fixedNow,
  });
}

test("valid request is persisted and returns a pending booking reference", async () => {
  let persisted;
  const handler = createTestHandler(async (reservation) => {
    persisted = reservation;
  });

  const response = await handler(createRequest(validReservation));
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(persisted.customerName, "Alex Rivera");
  assert.equal(persisted.customerEmail, "alex@example.com");
  assert.equal(persisted.specialRequests, "Window seat, if available.");
  assert.equal(persisted.bookingReference, "LB-261120-0123456789ABCDEF");
  assert.deepEqual(body.reservation, {
    bookingReference: "LB-261120-0123456789ABCDEF",
    reservationDate: "2026-11-20",
    reservationTime: "18:30",
    guestCount: 2,
    status: "pending",
  });
  assert.equal(JSON.stringify(body).includes("alex@example.com"), false);
});

test("generated booking references follow the unique public format", async () => {
  const references = new Set();
  const handler = createReservationHandler(
    async (reservation) => {
      references.add(reservation.bookingReference);
    },
    { now: fixedNow },
  );

  for (let index = 0; index < 32; index += 1) {
    const response = await handler(createRequest(validReservation));
    assert.equal(response.status, 201);
  }

  assert.equal(references.size, 32);
  assert.equal(
    [...references].every((reference) =>
      /^LB-261120-[A-F0-9]{16}$/.test(reference),
    ),
    true,
  );
});

test("missing required fields return field-specific validation errors", async () => {
  const handler = createTestHandler();
  const response = await handler(createRequest({}));
  const body = await response.json();

  assert.equal(response.status, 400);
  for (const field of [
    "customerName",
    "customerEmail",
    "customerPhone",
    "reservationDate",
    "reservationTime",
    "guestCount",
  ]) {
    assert.equal(typeof body.error.fieldErrors[field], "string");
  }
});

test("invalid email is rejected", async () => {
  const handler = createTestHandler();
  const response = await handler(
    createRequest({ ...validReservation, customerEmail: "not-an-email" }),
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.match(body.error.fieldErrors.customerEmail, /email/i);
});

test("invalid phone numbers are rejected", async () => {
  const handler = createTestHandler();
  const response = await handler(
    createRequest({ ...validReservation, customerPhone: "call me" }),
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.match(body.error.fieldErrors.customerPhone, /phone/i);
});

test("past, impossible, and closed-day dates are rejected", async () => {
  const handler = createTestHandler();

  for (const date of ["2026-11-18", "2026-02-30", "2026-11-23"]) {
    const response = await handler(
      createRequest({ ...validReservation, reservationDate: date }),
    );
    const body = await response.json();

    assert.equal(response.status, 400, `expected ${date} to be rejected`);
    assert.equal(typeof body.error.fieldErrors.reservationDate, "string");
  }
});

test("guest counts outside 1–8 are rejected", async () => {
  const handler = createTestHandler();

  for (const guestCount of [0, 9, 1.5, "2"]) {
    const response = await handler(
      createRequest({ ...validReservation, guestCount }),
    );
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(typeof body.error.fieldErrors.guestCount, "string");
  }
});

test("invalid time slots are rejected", async () => {
  const handler = createTestHandler();
  const response = await handler(
    createRequest({ ...validReservation, reservationTime: "22:30" }),
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(typeof body.error.fieldErrors.reservationTime, "string");
});

test("reservation requests are throttled and the limit resets", () => {
  const identity = `test-rate-limit-${Date.now()}`;
  const firstFive = Array.from({ length: 5 }, (_, index) =>
    consumeReservationRequest(identity, 1_000_000 + index),
  );
  const blocked = consumeReservationRequest(identity, 1_000_005);
  const afterWindow = consumeReservationRequest(
    identity,
    1_000_000 + 15 * 60 * 1000,
  );

  assert.equal(firstFive.every((result) => !result.limited), true);
  assert.equal(blocked.limited, true);
  assert.equal(blocked.retryAfterSeconds, 900);
  assert.equal(afterWindow.limited, false);
});

test("persistence failures return a safe error without leaking internals", async () => {
  const handler = createTestHandler(async () => {
    throw new Error("private database connection detail");
  });

  const response = await handler(createRequest(validReservation));
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.match(body.error.message, /try again/i);
  assert.equal(JSON.stringify(body).includes("private database"), false);
});

test("malformed JSON and non-JSON requests are rejected", async () => {
  const handler = createTestHandler();
  const malformed = new Request("http://localhost/api/reservations", {
    body: "{",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const nonJson = new Request("http://localhost/api/reservations", {
    body: "reservation",
    headers: { "Content-Type": "text/plain" },
    method: "POST",
  });

  assert.equal((await handler(malformed)).status, 400);
  assert.equal((await handler(nonJson)).status, 415);
});
