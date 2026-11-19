import {
  contactFieldNames,
  contactSchema,
  type ContactField,
  type ContactSubmission,
} from "./validation.ts";

export type ContactMessageInsert = ContactSubmission;

type PersistContactMessage = (
  contactMessage: ContactMessageInsert,
) => Promise<void>;

function jsonResponse(body: unknown, status: number) {
  return Response.json(body, {
    headers: { "Cache-Control": "no-store" },
    status,
  });
}

export function createContactHandler(
  persistContactMessage: PersistContactMessage,
) {
  return async function handleContactRequest(request: Request) {
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return jsonResponse(
        {
          error: {
            code: "UNSUPPORTED_CONTENT_TYPE",
            message: "Submit your message as JSON.",
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
            message: "The message request could not be read.",
          },
        },
        400,
      );
    }

    const result = contactSchema.safeParse(payload);

    if (!result.success) {
      const fieldErrors: Partial<Record<ContactField, string>> = {};

      for (const issue of result.error.issues) {
        const field = contactFieldNames.find(
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

    try {
      await persistContactMessage(result.data);
    } catch {
      console.error("Contact message could not be persisted.");

      return jsonResponse(
        {
          error: {
            code: "CONTACT_UNAVAILABLE",
            message:
              "We couldn't send your message just now. Please try again later.",
          },
        },
        503,
      );
    }

    return jsonResponse(
      {
        contactMessage: {
          status: "new",
          received: true,
        },
      },
      201,
    );
  };
}
