interface RateLimiterOptions {
  maximumRequests: number;
  windowMilliseconds: number;
  maximumBuckets?: number;
}

export function createRateLimiter({
  maximumRequests,
  windowMilliseconds,
  maximumBuckets = 10_000,
}: RateLimiterOptions) {
  const requestBuckets = new Map<string, { count: number; resetAt: number }>();

  // Process-local throttling is best-effort; production instances need a shared edge limiter.
  return function consumeRequest(identity: string, now = Date.now()) {
    if (requestBuckets.size >= maximumBuckets) {
      for (const [key, bucket] of requestBuckets) {
        if (bucket.resetAt <= now) {
          requestBuckets.delete(key);
        }
      }

      if (requestBuckets.size >= maximumBuckets) {
        const oldestIdentity = requestBuckets.keys().next().value;
        if (oldestIdentity !== undefined && oldestIdentity !== identity) {
          requestBuckets.delete(oldestIdentity);
        }
      }
    }

    const current = requestBuckets.get(identity);

    if (!current || current.resetAt <= now) {
      requestBuckets.set(identity, {
        count: 1,
        resetAt: now + windowMilliseconds,
      });
      return { limited: false, retryAfterSeconds: 0 };
    }

    if (current.count >= maximumRequests) {
      return {
        limited: true,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((current.resetAt - now) / 1000),
        ),
      };
    }

    current.count += 1;
    return { limited: false, retryAfterSeconds: 0 };
  };
}

export function getRequestIdentity(request: Request) {
  const directIdentity = request.headers.get("x-real-ip");
  const forwardedIdentity = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    .trim();

  return directIdentity || forwardedIdentity || "unknown";
}
