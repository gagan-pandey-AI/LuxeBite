import { randomBytes } from "node:crypto";
import {
  createReservationSchema,
  reservationFieldNames,
  type ReservationField,
  type ReservationSubmission,
} from "./validation.ts";

export type ReservationInsert = ReservationSubmission & {
  bookingReference: string;
};

type PersistReservation = (reservation: ReservationInsert) => Promise<void>;

interface HandlerOptions {
  now?: () => Date;
  createReference?: (reservationDate: string) => string;
}

function createBookingReference(reservationDate: string) {
  const datePart = reservationDate.replaceAll("-", "").slice(2);
  const randomPart = randomBytes(8).toString("hex").toUpperCase();

  return `LB-${datePart}-${randomPart}`;
}

function jsonResponse(body: unknown, status: number) {
  return Response.json(body, {
    headers: { "Cache-Control": "no-store" },
    status,
  });
}

export function createReservationHandler(
  persistReservation: PersistReservation,
  options: HandlerOptions = {},
) {
  const now = options.now ?? (() => new Date());
  const createReference = options.createReference ?? createBookingReference;
  const schema = createReservationSchema(now);

  return async function handleReservationRequest(request: Request) {
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return jsonResponse(
        {
          error: {
            code: "UNSUPPORTED_CONTENT_TYPE",
            message: "Submit the reservation as JSON.",
          },
        },
        415,
      );
    }

    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return jsonResponse(
        {
          error: {
            code: "INVALID_JSON",
            message: "The reservation request could not be read.",
          },
        },
        400,
      );
    }

    const result = schema.safeParse(payload);

    if (!result.success) {
      const fieldErrors: Partial<Record<ReservationField, string>> = {};

      for (const issue of result.error.issues) {
        const field = reservationFieldNames.find(
          (name) => name === issue.path[0],
        );

        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }

      return jsonResponse(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Please review the highlighted fields.",
            fieldErrors,
          },
        },
        400,
      );
    }

    const bookingReference = createReference(result.data.reservationDate);

    try {
      await persistReservation({
        ...result.data,
        bookingReference,
      });
    } catch {
      console.error("Reservation request could not be persisted.");

      return jsonResponse(
        {
          error: {
            code: "RESERVATION_UNAVAILABLE",
            message:
              "We couldn't submit your request just now. Please try again or contact the restaurant.",
          },
        },
        503,
      );
    }

    return jsonResponse(
      {
        reservation: {
          bookingReference,
          reservationDate: result.data.reservationDate,
          reservationTime: result.data.reservationTime,
          guestCount: result.data.guestCount,
          status: "pending",
        },
      },
      201,
    );
  };
}
