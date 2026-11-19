import { z } from "zod";
import type { ReservationStatus } from "@/types/reservations";
import { authorizationFailure } from "./http.ts";

const reservationIdSchema = z.string().uuid();
const statusSchema = z.enum(["pending", "confirmed", "rejected", "cancelled"]);
const reservationFilterSchema = z.object({
  search: z.string().trim().max(100).default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(["all", "pending", "confirmed", "rejected", "cancelled"]).default("all"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
});

const allowedTransitions: Record<ReservationStatus, readonly ReservationStatus[]> = {
  pending: ["confirmed", "rejected", "cancelled"],
  confirmed: ["cancelled"],
  rejected: [],
  cancelled: [],
};

export type ReservationFilters = z.infer<typeof reservationFilterSchema>;

interface ReservationListDependencies<T> {
  authorize: () => Promise<
    | { status: "authorized" }
    | { status: "unauthenticated" }
    | { status: "forbidden" }
    | { status: "unavailable" }
  >;
  list: (filters: ReservationFilters) => Promise<{ rows: T[]; total: number }>;
}

interface ReservationStatusDependencies<T> {
  authorize: ReservationListDependencies<T>["authorize"];
  getStatus: (id: string) => Promise<ReservationStatus | null>;
  updateStatus: (
    id: string,
    currentStatus: ReservationStatus,
    status: ReservationStatus,
  ) => Promise<T | null>;
}

export function createReservationListHandler<T>(
  dependencies: ReservationListDependencies<T>,
) {
  return async function handleReservationList(request: Request) {
    const authorization = await dependencies.authorize();
    const failure = authorizationFailure(authorization);
    if (failure) return failure;

    const params = new URL(request.url).searchParams;
    const parsed = reservationFilterSchema.safeParse({
      search: params.get("search") ?? "",
      date: params.get("date") || undefined,
      status: params.get("status") ?? "all",
      page: params.get("page") ?? 1,
    });

    if (!parsed.success) {
      return Response.json(
        { error: { code: "INVALID_FILTERS", message: "One or more filters are invalid." } },
        { status: 400 },
      );
    }

    const filterDate = parsed.data.date
      ? new Date(`${parsed.data.date}T00:00:00Z`)
      : null;
    if (
      parsed.data.date &&
      (!filterDate ||
        Number.isNaN(filterDate.valueOf()) ||
        filterDate.toISOString().slice(0, 10) !== parsed.data.date)
    ) {
      return Response.json(
        { error: { code: "INVALID_DATE", message: "Choose a valid reservation date." } },
        { status: 400 },
      );
    }

    try {
      const result = await dependencies.list(parsed.data);
      return Response.json(
        { reservations: result.rows, total: result.total, page: parsed.data.page, pageSize: 25 },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch {
      return Response.json(
        { error: { code: "RESERVATIONS_UNAVAILABLE", message: "Reservations could not be loaded." } },
        { status: 500 },
      );
    }
  };
}

export function createReservationStatusHandler<T>(
  dependencies: ReservationStatusDependencies<T>,
) {
  return async function handleReservationStatus(id: string, request: Request) {
    const authorization = await dependencies.authorize();
    const failure = authorizationFailure(authorization);
    if (failure) return failure;

    if (!reservationIdSchema.safeParse(id).success) {
      return Response.json(
        { error: { code: "INVALID_RESERVATION", message: "The reservation could not be found." } },
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

    const parsed = z.object({ status: statusSchema }).safeParse(payload);
    if (!parsed.success) {
      return Response.json(
        { error: { code: "INVALID_STATUS", message: "Choose a valid reservation status." } },
        { status: 400 },
      );
    }

    try {
      const currentStatus = await dependencies.getStatus(id);
      if (!currentStatus) {
        return Response.json(
          { error: { code: "NOT_FOUND", message: "This reservation no longer exists." } },
          { status: 404 },
        );
      }

      if (!allowedTransitions[currentStatus].includes(parsed.data.status)) {
        return Response.json(
          { error: { code: "INVALID_TRANSITION", message: "That reservation status change is not allowed." } },
          { status: 409 },
        );
      }

      const reservation = await dependencies.updateStatus(
        id,
        currentStatus,
        parsed.data.status,
      );
      if (!reservation) {
        return Response.json(
          { error: { code: "CONCURRENT_UPDATE", message: "The reservation changed. Refresh and try again." } },
          { status: 409 },
        );
      }
      return Response.json({ reservation }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return Response.json(
        { error: { code: "UPDATE_FAILED", message: "The reservation could not be updated." } },
        { status: 500 },
      );
    }
  };
}
