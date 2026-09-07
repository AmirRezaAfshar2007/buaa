import rateLimit from 'express-rate-limit';

/** Applied to the whole /api surface. Generous, just stops gross abuse/scraping. */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down and try again shortly.' },
});

/**
 * Applied to /api/auth/login. Brute-force protection: 5 attempts per 15
 * minutes per IP, as required by the security hardening spec.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true,
});

/**
 * Applied to registration and forgot-password, which are also attractive
 * targets for enumeration / spam but need a looser limit than login.
 */
export const sensitiveAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in an hour.' },
});

/**
 * Applied to /api/speaking/analyze. Voice analysis calls out to the AI
 * engine and is more expensive than a normal request, so it gets its own
 * tighter budget separate from the general API limiter.
 */
export const speakingAnalysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many speaking analyses this hour. Please try again later.' },
});

/**
 * Applied to /api/speaking/transcribe-chunk. Powers the live caption shown
 * while the user is still recording, so the frontend polls this every few
 * seconds for the duration of a recording (up to the 2-minute recording cap,
 * so ~30-40 calls for one long recording). That's much more frequent than
 * /analyze (called once per submission), so it needs its own, looser-per-call
 * but still-bounded budget rather than sharing speakingAnalysisLimiter.
 */
export const speakingCaptionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many live caption requests. Please try again shortly.' },
});
