import assert from "node:assert/strict";
import { test } from "node:test";
import { createReservationStatusHandler } from "../src/lib/admin/reservations.ts";
import { createMenuMutationHandler } from "../src/lib/admin/menu.ts";
import { createMessageStatusHandler } from "../src/lib/admin/messages.ts";

const id = "550e8400-e29b-41d4-a716-446655440000";
const request = (status) =>
  new Request(`http://localhost/api/admin/reservations/${id}`, {
    body: JSON.stringify({ status }),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });

test("pending reservation can be confirmed and persists the new status", async () => {
  let savedStatus = "";
  const handler = createReservationStatusHandler({
    authorize: async () => ({ status: "authorized" }),
    getStatus: async () => "pending",
    updateStatus: async (_id, current, next) => {
      assert.equal(current, "pending");
      savedStatus = next;
      return { id, status: next };
    },
  });

  const response = await handler(id, request("confirmed"));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(savedStatus, "confirmed");
  assert.equal(body.reservation.status, "confirmed");
});

test("status updates reject unauthorized users before any database operation", async () => {
  let databaseCalled = false;
  const handler = createReservationStatusHandler({
    authorize: async () => ({ status: "forbidden" }),
    getStatus: async () => {
      databaseCalled = true;
      return "pending";
    },
    updateStatus: async () => {
      databaseCalled = true;
      return null;
    },
  });

  const response = await handler(id, request("confirmed"));

  assert.equal(response.status, 403);
  assert.equal(databaseCalled, false);
});

test("terminal reservation states cannot be reopened", async () => {
  const handler = createReservationStatusHandler({
    authorize: async () => ({ status: "authorized" }),
    getStatus: async () => "rejected",
    updateStatus: async () => {
      throw new Error("must not update");
    },
  });

  const response = await handler(id, request("confirmed"));

  assert.equal(response.status, 409);
  assert.equal((await response.json()).error.code, "INVALID_TRANSITION");
});

test("database failures return a sanitized error", async () => {
  const handler = createReservationStatusHandler({
    authorize: async () => ({ status: "authorized" }),
    getStatus: async () => {
      throw new Error("private database detail");
    },
    updateStatus: async () => null,
  });

  const response = await handler(id, request("cancelled"));
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.equal(JSON.stringify(body).includes("private database detail"), false);
});

test("concurrent status changes do not overwrite a newer transition", async () => {
  const handler = createReservationStatusHandler({
    authorize: async () => ({ status: "authorized" }),
    getStatus: async () => "pending",
    updateStatus: async () => null,
  });

  const response = await handler(id, request("confirmed"));

  assert.equal(response.status, 409);
  assert.equal((await response.json()).error.code, "CONCURRENT_UPDATE");
});

const menuItem = {
  id: "seasonal-asparagus",
  name: "Seasonal Asparagus",
  description: "Charred asparagus with lemon and herbs",
  price: 740,
  category: "Starters",
  image_url: "/images/asparagus.webp",
  image_storage_path: null,
  image_alt: "Charred green asparagus finished with lemon",
  ingredients: ["Asparagus", "Lemon", "Parsley"],
  is_vegetarian: true,
  is_bestseller: false,
  is_chef_recommended: false,
  is_featured: false,
  is_available: true,
  sort_order: 15,
};

const menuRequest = (method, body) =>
  new Request("http://localhost/api/admin/menu-items", {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    method,
  });

function menuDependencies(overrides = {}) {
  return {
    authorize: async () => ({ status: "authorized" }),
    create: async (item) => item,
    update: async (id, changes) => ({ id, ...menuItem, ...changes }),
    remove: async () => ({ imageStoragePath: null }),
    cleanupImage: async () => {},
    ...overrides,
  };
}

test("admin menu creation validates and persists a menu item", async () => {
  let inserted;
  const handler = createMenuMutationHandler(menuDependencies({
    create: async (item) => {
      inserted = item;
      return item;
    },
  }));
  const response = await handler(menuRequest("POST", menuItem));
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(inserted.id, menuItem.id);
  assert.equal(body.item.price, 740);
});

test("menu creation rejects invalid values before persistence", async () => {
  let inserted = false;
  const handler = createMenuMutationHandler(menuDependencies({
    create: async () => {
      inserted = true;
      return menuItem;
    },
  }));
  const response = await handler(menuRequest("POST", { ...menuItem, price: -10 }));

  assert.equal(response.status, 400);
  assert.equal(inserted, false);
});

test("admin menu editing persists changes", async () => {
  let updated;
  const handler = createMenuMutationHandler(menuDependencies({
    update: async (id, changes) => {
      updated = { id, ...changes };
      return updated;
    },
  }));
  const response = await handler(
    menuRequest("PATCH", { price: 850, is_available: false }),
    menuItem.id,
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(updated, { id: menuItem.id, price: 850, is_available: false });
  assert.equal(body.item.is_available, false);
});

test("admin menu deletion removes the image after deleting the record", async () => {
  let removedImage;
  const handler = createMenuMutationHandler(menuDependencies({
    remove: async () => ({ imageStoragePath: "items/550e8400-e29b-41d4-a716-446655440000.webp" }),
    cleanupImage: async (path) => {
      removedImage = path;
    },
  }));
  const response = await handler(menuRequest("DELETE"), menuItem.id);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.deleted, true);
  assert.equal(removedImage, "items/550e8400-e29b-41d4-a716-446655440000.webp");
});

test("menu database failures are returned as a sanitized error", async () => {
  const handler = createMenuMutationHandler(menuDependencies({
    create: async () => {
      throw new Error("private database detail");
    },
  }));
  const response = await handler(menuRequest("POST", menuItem));
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.equal(JSON.stringify(body).includes("private database detail"), false);
});

const messageId = "550e8400-e29b-41d4-a716-446655440000";
const messageRequest = (status) =>
  new Request(`http://localhost/api/admin/messages/${messageId}`, {
    body: JSON.stringify({ status }),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });

test("contact messages can be marked replied and persisted", async () => {
  let persisted;
  const handler = createMessageStatusHandler({
    authorize: async () => ({ status: "authorized" }),
    getStatus: async () => "read",
    updateStatus: async (_id, current, next) => {
      persisted = { current, next };
      return { id: messageId, status: next };
    },
  });
  const response = await handler(messageId, messageRequest("replied"));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(persisted, { current: "read", next: "replied" });
  assert.equal(body.message.status, "replied");
});

test("contact message status updates reject unauthorized access", async () => {
  let accessedDatabase = false;
  const handler = createMessageStatusHandler({
    authorize: async () => ({ status: "unauthenticated" }),
    getStatus: async () => {
      accessedDatabase = true;
      return "new";
    },
    updateStatus: async () => null,
  });
  const response = await handler(messageId, messageRequest("read"));

  assert.equal(response.status, 401);
  assert.equal(accessedDatabase, false);
});

test("contact message database failure does not expose internals", async () => {
  const handler = createMessageStatusHandler({
    authorize: async () => ({ status: "authorized" }),
    getStatus: async () => "new",
    updateStatus: async () => {
      throw new Error("private database detail");
    },
  });
  const response = await handler(messageId, messageRequest("archived"));
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.equal(JSON.stringify(body).includes("private database detail"), false);
});
