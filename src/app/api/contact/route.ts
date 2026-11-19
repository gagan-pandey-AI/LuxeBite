import { createContactHandler } from "@/lib/contact/handler";
import { consumeContactRequest } from "@/lib/contact/rate-limit";
import { persistContactMessage } from "@/lib/contact/supabase";
import { getRequestIdentity } from "@/lib/rate-limit";

export const runtime = "nodejs";

const submitContactMessage = createContactHandler(persistContactMessage);

export async function POST(request: Request) {
  const rateLimit = consumeContactRequest(getRequestIdentity(request));

  if (rateLimit.limited) {
    return Response.json(
      {
        error: {
          code: "RATE_LIMITED",
          message:
            "Too many messages have been sent. Please wait a little before trying again.",
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

  return submitContactMessage(request);
}
