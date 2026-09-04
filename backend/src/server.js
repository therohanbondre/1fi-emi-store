// server.js — Entry point. Binds the Express app to a TCP port.
// Separated from app.js so the application logic can be imported in tests
// without binding to a port.

import app    from './app.js'
import prisma from './lib/prisma.js'

const PORT = parseInt(process.env.PORT ?? '5000', 10)

// ── Process-level safety nets ─────────────────────────────────────────────
// Catch anything that slips past Express error handling.
// Log it and exit cleanly — a process manager (PM2, Docker) will restart.

process.on('unhandledRejection', (reason) => {
  console.error('[process] Unhandled Promise Rejection:')
  console.error(reason)
  // Exit so the process manager restarts with a clean state.
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  console.error('[process] Uncaught Exception:')
  console.error(err.stack ?? err.message)
  process.exit(1)
})

// ── Start ─────────────────────────────────────────────────────────────────

async function start() {
  // Try to connect to the database, but don't block startup if it's not
  // available yet. In Step 1 (project setup) the DB may not exist.
  // API routes that need the DB will fail with a 503 until it's ready.
  try {
    await prisma.$connect()
    console.log('[db]  Connected to PostgreSQL')
  } catch (err) {
    console.warn('[db]  Could not connect to PostgreSQL:', err.message)
    console.warn('[db]  The server will start anyway. Set up the DB in a later step.')
    console.warn('[db]  Check DATABASE_URL in backend/.env when you are ready.')
  }

  const server = app.listen(PORT, () => {
    console.log(`[api] Server listening  →  http://localhost:${PORT}`)
    console.log(`[api] Health check      →  http://localhost:${PORT}/api/health`)
    console.log(`[api] Frontend origin   →  ${process.env.FRONTEND_URL ?? 'http://localhost:5173 (default)'}`)
  })

  // Graceful shutdown on SIGTERM (Docker / cloud) and SIGINT (Ctrl+C)
  async function shutdown(signal) {
    console.log(`\n[api] ${signal} received — shutting down gracefully`)
    server.close(async () => {
      await prisma.$disconnect()
      console.log('[db]  Disconnected from PostgreSQL')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT',  () => shutdown('SIGINT'))
}

start()
