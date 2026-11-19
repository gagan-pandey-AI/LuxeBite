import { createRateLimiter } from "@/lib/rate-limit";

export const consumeContactRequest = createRateLimiter({
  maximumRequests: 5,
  windowMilliseconds: 15 * 60 * 1000,
});
