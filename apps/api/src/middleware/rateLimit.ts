import rateLimit from "express-rate-limit";

// The integration suite runs many sequential requests against auth/booking
// endpoints in a single process (vitest.integration.config.ts's
// fileParallelism: false keeps one shared module cache, so a real limiter
// here would accumulate hits across every test file, not just one). Rate
// limiting itself is exercised deliberately by tests/integration/
// rateLimit-style assertions where present; elsewhere it must not throttle
// unrelated tests, so it's disabled under NODE_ENV=test (set by Vitest).
const disabledInTests = process.env.NODE_ENV === "test";
const skip = () => disabledInTests;

// research.md R10 / constitution: stricter limits on auth and public
// booking/quote/feedback endpoints, standard limits elsewhere.
export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please try again shortly.",
    },
  },
});

export const standardRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please try again shortly.",
    },
  },
});
