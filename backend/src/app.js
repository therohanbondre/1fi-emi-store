// app.js — Express application factory.
// Wires middleware, routes, and error handling.
// Deliberately separated from server.js so the app can be imported
// in tests without binding to a port.

import express    from 'express'
import cors       from 'cors'
import 'dotenv/config'
import { createRequire } from 'module'

import { requestLogger } from './middleware/requestLogger.js'
import { notFound }      from './middleware/notFound.js'
import { errorHandler }  from './middleware/errorHandler.js'
import productRoutes     from './routes/products.js'
import openApiSpec       from './docs/openapi.js'

// swagger-ui-express is CJS — use createRequire to import it in an ESM module
const require   = createRequire(import.meta.url)
const swaggerUi = require('swagger-ui-express')

const app = express()

// ---------------------------------------------------------------------------
// CORS
// Allow the frontend dev server (Vite :5173) and any FRONTEND_URL set in .env.
// In production, only the explicit FRONTEND_URL is whitelisted.
// ---------------------------------------------------------------------------

const allowedOrigins = new Set([
  'http://localhost:5173',        // Vite default
  'http://localhost:5174',        // Vite fallback when 5173 is busy
  'http://localhost:3000',        // fallback CRA / next
  process.env.FRONTEND_URL,       // set in .env for production
].filter(Boolean))

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true)
    if (allowedOrigins.has(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} is not allowed`))
  },
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// ---------------------------------------------------------------------------
// Body parsing
// ---------------------------------------------------------------------------

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ---------------------------------------------------------------------------
// Request logger
// ---------------------------------------------------------------------------

app.use(requestLogger)

// ---------------------------------------------------------------------------
// Health check — outside /api/products so it never hits the router
// ---------------------------------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({
    success:   true,
    data: {
      status:    'ok',
      timestamp: new Date().toISOString(),
      env:       process.env.NODE_ENV ?? 'development',
    },
  })
})

// ---------------------------------------------------------------------------
// Swagger UI — API documentation
// Available at /api-docs  (no auth required; development / demo use)
// ---------------------------------------------------------------------------

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customSiteTitle: '1Fi EMI Store API Docs',
  swaggerOptions: {
    persistAuthorization: false,
    // Filter/sort the operations for readability
    defaultModelsExpandDepth: 1,
    docExpansion: 'list',
  },
}))

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------

app.use('/api/products', productRoutes)

// ---------------------------------------------------------------------------
// 404 + error handling (must be last)
// ---------------------------------------------------------------------------

app.use(notFound)
app.use(errorHandler)

export default app
