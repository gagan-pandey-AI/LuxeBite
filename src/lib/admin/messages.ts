import { z } from "zod";
import { authorizationFailure } from "./http.ts";
import type { AdminAuthorizationResult } from "./authorization";
import type { ContactMessageStatus } from "@/types/contact";

const messageStatusSchema = z.enum(["new", "read", "replied", "archived"]);
const messageFilterSchema = z.object({
  search: z.string().trim().max(120).default(""),
  status: z.enum(["all", "new", "read", "replied", "archived"]).default("all"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
});
const idSchema = z.string().uuid();

export type MessageFilters = z.infer<typeof messageFilterSchema>;

const messageTransitions: Record<ContactMessageStatus, readonly ContactMessageStatus[]> = {
  new: ["read", "replied", "archived"],
  read: ["replied", "archived"],
  replied: ["read", "archived"],
  archived: ["read", "replied"],
};

interface MessageDependencies<T> {
  authorize: () => Promise<AdminAuthorizationResult>;
  list: (filters: MessageFilters) => Promise<{ rows: T[]; total: number }>;
  getStatus: (id: string) => Promise<ContactMessageStatus | null>;
  updateStatus: (
    id: string,
    current: ContactMessageStatus,
    next: ContactMessageStatus,
  ) => Promise<T | null>;
}

export function createMessageListHandler<T>(
  dependencies: Pick<MessageDependencies<T>, "authorize" | "list">,
) {
  return async function handleMessageList(request: Request) {
    const failure = authorizationFailure(await dependencies.authorize());
    if (failure) return failure;
    const params = new URL(request.url).searchParams;
    const parsed = messageFilterSchema.safeParse({
      search: params.get("search") ?? "",
      status: params.get("status") ?? "all",
      page: params.get("page") ?? 1,
    });
    if (!parsed.success) {
      return Response.json(
        { error: { code: "INVALID_FILTERS", message: "One or more filters are invalid." } },
        { status: 400 },
      );
    }
    try {
      const { rows, total } = await dependencies.list(parsed.data);
      return Response.json(
        { messages: rows, total, page: parsed.data.page, pageSize: 25 },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch {
      return Response.json(
        { error: { code: "MESSAGES_UNAVAILABLE", message: "Contact messages could not be loaded." } },
        { status: 500 },
      );
    }
  };
}

export function createMessageStatusHandler<T>(
  dependencies: Pick<MessageDependencies<T>, "authorize" | "getStatus" | "updateStatus">,
) {
  return async function handleMessageStatus(id: string, request: Request) {
    const failure = authorizationFailure(await dependencies.authorize());
    if (failure) return failure;
    if (!idSchema.safeParse(id).success) {
      return Response.json(
        { error: { code: "INVALID_MESSAGE", message: "The message could not be found." } },
        { status: 400 },
      );
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return Response.json(
        { error: { code: "INVALID_JSON", message: "The request could not be read." } },
        { status: 400 },
      );
    }
    const parsed = z.object({ status: messageStatusSchema }).safeParse(payload);
    if (!parsed.success) {
      return Response.json(
        { error: { code: "INVALID_STATUS", message: "Choose a valid message status." } },
        { status: 400 },
      );
    }

    try {
      const current = await dependencies.getStatus(id);
      if (!current) {
        return Response.json(
          { error: { code: "NOT_FOUND", message: "This message no longer exists." } },
          { status: 404 },
        );
      }
      if (!messageTransitions[current].includes(parsed.data.status)) {
        return Response.json(
          { error: { code: "INVALID_TRANSITION", message: "That message status change is not allowed." } },
          { status: 409 },
        );
      }
      const message = await dependencies.updateStatus(id, current, parsed.data.status);
      if (!message) {
        return Response.json(
          { error: { code: "CONCURRENT_UPDATE", message: "The message changed. Refresh and try again." } },
          { status: 409 },
        );
      }
      return Response.json({ message }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return Response.json(
        { error: { code: "UPDATE_FAILED", message: "The message could not be updated." } },
        { status: 500 },
      );
    }
  };
}
