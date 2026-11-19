import { createReservationHandler } from "@/lib/reservations/handler";
import {
  consumeReservationRequest,
  getRequestIdentity,
} from "@/lib/reservations/rate-limit";
import { persistReservation } from "@/lib/reservations/supabase";

export const runtime = "nodejs";

const submitReservation = createReservationHandler(persistReservation);

export async function POST(request: Request) {
  const rateLimit = consumeReservationRequest(getRequestIdentity(request));

  if (rateLimit.limited) {
    return Response.json(
      {
        error: {
          code: "RATE_LIMITED",
          message:
            "Too many reservation requests. Please wait a little before trying again.",
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
        status: 429,
      },
    );
  }

  return submitReservation(request);
}
