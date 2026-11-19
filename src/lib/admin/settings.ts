import { z } from "zod";
import { authorizationFailure } from "./http.ts";
import type { AdminAuthorizationResult } from "./authorization";

export const restaurantSettingsSchema = z.object({
  restaurant_name: z.string().trim().min(2).max(100),
  address: z.string().trim().min(2).max(300),
  phone: z.string().trim().min(7).max(30).regex(/^[+0-9(). -]+$/),
  email: z.string().trim().toLowerCase().email().max(254),
  opening_hours: z.string().trim().min(3).max(500),
});

export type RestaurantSettingsInput = z.infer<typeof restaurantSettingsSchema>;

const patchSchema = restaurantSettingsSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
);

export function createRestaurantSettingsHandler<T>(dependencies: {
  authorize: () => Promise<AdminAuthorizationResult>;
  update: (input: Partial<RestaurantSettingsInput>) => Promise<T | null>;
}) {
  return async function handleSettingsUpdate(request: Request) {
    const failure = authorizationFailure(await dependencies.authorize());
    if (failure) return failure;
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return Response.json(
        { error: { code: "INVALID_JSON", message: "The settings could not be read." } },
        { status: 400 },
      );
    }

    const parsed = patchSchema.safeParse(payload);
    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Review the restaurant settings." } },
        { status: 400 },
      );
    }
    try {
      const settings = await dependencies.update(parsed.data);
      if (!settings) {
        return Response.json(
          { error: { code: "NOT_FOUND", message: "Restaurant settings have not been provisioned." } },
          { status: 404 },
        );
      }
      return Response.json({ settings }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return Response.json(
        { error: { code: "UPDATE_FAILED", message: "Restaurant settings could not be saved." } },
        { status: 500 },
      );
    }
  };
}
