// ─────────────────────────────────────────────────────────────────────────────
// Centralized error handler
//
// Must have exactly 4 parameters so Express recognises it as error middleware.
// Registered LAST in app.js — after all routes and the notFound handler.
//
// Error classification:
//   1. Application 404s   — our own notFoundError() with err.status = 404
//   2. Prisma P2025       — findUnique returned null and we didn't catch it
//   3. Prisma P1xxx/P2xxx — database / connection-level errors
//   4. SyntaxError        — malformed JSON in request body (express.json)
//   5. CORS errors        — origin not in allowedOrigins
//   6. Generic client 4xx — err.status < 500 (from application code)
//   7. Everything else    — 500; stack hidden in production
//
// NEVER exposes:
//   - Stack traces to the client in production
//   - DATABASE_URL or any environment variable
//   - Internal Prisma query strings
// ─────────────────────────────────────────────────────────────────────────────

export function errorHandler(err, req, res, _next) {
  const isDev = process.env.NODE_ENV !== 'production'

  // ── Server-side logging ───────────────────────────────────────────────────
  // Development: full stack for easy debugging.
  // Production:  one-liner to avoid filling logs with noise.
  if (isDev) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`)
    console.error(err.stack ?? err.message)
  } else {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} — ${err.message}`)
  }

  // ── Guard: never send two responses ───────────────────────────────────────
  if (res.headersSent) return

  // ── 1. Application-level 404 (our own notFoundError) ────────────────────
  if (err.status === 404) {
    return res.status(404).json({
      success: false,
      error: {
        code:    err.code    ?? 'NOT_FOUND',
        message: err.message ?? 'The requested resource was not found',
      },
    })
  }

  // ── 2. Prisma: record not found (findUniqueOrThrow / P2025) ─────────────
  if (err.code === 'P2025' || err.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      error: {
        code:    'NOT_FOUND',
        message: 'The requested resource was not found',
      },
    })
  }

  // ── 3. Prisma: database / connection errors ───────────────────────────────
  // P1xxx = connection-level  P2xxx = query-level  P3xxx = migration
  const isPrismaError =
    err.name === 'PrismaClientKnownRequestError'    ||
    err.name === 'PrismaClientUnknownRequestError'  ||
    err.name === 'PrismaClientRustPanicError'        ||
    err.name === 'PrismaClientInitializationError'  ||
    err.name === 'PrismaClientValidationError'

  if (isPrismaError) {
    // P1001 / P1017 = cannot reach database server
    const isConnectionError =
      typeof err.code === 'string' && err.code.startsWith('P1')

    if (isConnectionError) {
      return res.status(503).json({
        success: false,
        error: {
          code:    'DATABASE_UNAVAILABLE',
          message: 'The database is temporarily unavailable. Please try again shortly.',
        },
      })
    }

    // Other Prisma errors — don't leak query details to client
    return res.status(500).json({
      success: false,
      error: {
        code:    'DATABASE_ERROR',
        message: isDev
          ? err.message
          : 'A database error occurred. Please try again.',
      },
    })
  }

  // ── 4. SyntaxError from express.json() (malformed JSON body) ────────────
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code:    'INVALID_JSON',
        message: 'The request body contains invalid JSON.',
      },
    })
  }

  // ── 5. CORS errors ────────────────────────────────────────────────────────
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({
      success: false,
      error: {
        code:    'CORS_NOT_ALLOWED',
        message: 'Cross-origin request blocked.',
      },
    })
  }

  // ── 6. Generic client errors (application-thrown with err.status < 500) ──
  if (err.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({
      success: false,
      error: {
        code:    err.code    ?? 'CLIENT_ERROR',
        message: err.message ?? 'Bad request',
      },
    })
  }

  // ── 7. Everything else → 500 ─────────────────────────────────────────────
  // Never reveal implementation details in production.
  return res.status(500).json({
    success: false,
    error: {
      code:    'INTERNAL_SERVER_ERROR',
      message: isDev
        ? (err.message ?? 'An unexpected error occurred')
        : 'An unexpected error occurred. Please try again later.',
    },
  })
}
