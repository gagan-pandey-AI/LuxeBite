import { createRateLimiter, getRequestIdentity } from "../rate-limit.ts";

export const consumeReservationRequest = createRateLimiter({
  maximumRequests: 5,
  windowMilliseconds: 15 * 60 * 1000,
});

export { getRequestIdentity };
