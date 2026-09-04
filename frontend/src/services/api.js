// api.js — central API service.
//
// All fetch calls go through this file.
// Components never call fetch() directly.
//
// Base URL:
//   Development: Vite proxy forwards /api/* → localhost:5000 (no CORS needed)
//   Production:  set VITE_API_URL to the deployed backend base URL
//
// Response envelope from backend:
//   Success  →  { success: true,  data: <payload>, meta?: { count } }
//   Error    →  { success: false, error: { code, message } }

// Use || so an empty string (VITE_API_URL=) also falls back to the Vite proxy
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

// ---------------------------------------------------------------------------
// Internal request helper
// ---------------------------------------------------------------------------

async function request(path) {
  let res

  // Catch network errors (server unreachable, DNS failure, backend down, etc.)
  try {
    res = await fetch(`${BASE_URL}${path}`)
  } catch {
    const err = new Error(
      'Cannot reach the server. Make sure the backend is running and try again.'
    )
    err.status = 0           // 0 = network-level failure (no HTTP status)
    err.code   = 'NETWORK_ERROR'
    throw err
  }

  // Try to parse JSON — guard against proxy/CDN HTML error pages
  let json
  try {
    json = await res.json()
  } catch {
    const err = new Error(`Unexpected response from server (HTTP ${res.status})`)
    err.status = res.status
    err.code   = 'INVALID_RESPONSE'
    throw err
  }

  if (!res.ok) {
    // Use the backend's structured error message when available
    const message =
      json?.error?.message ?? `Request failed with status ${res.status}`
    const err     = new Error(message)
    err.status    = res.status
    err.code      = json?.error?.code ?? 'API_ERROR'
    throw err
  }

  // Unwrap the { success, data } envelope
  return json.data
}

/**
 * Like request() but returns the full { data, meta } envelope.
 * Used for paginated endpoints where the caller needs meta.pagination.
 */
async function requestFull(path) {
  let res
  try {
    res = await fetch(`${BASE_URL}${path}`)
  } catch {
    const err = new Error(
      'Cannot reach the server. Make sure the backend is running and try again.'
    )
    err.status = 0
    err.code   = 'NETWORK_ERROR'
    throw err
  }
  let json
  try {
    json = await res.json()
  } catch {
    const err = new Error(`Unexpected response from server (HTTP ${res.status})`)
    err.status = res.status
    err.code   = 'INVALID_RESPONSE'
    throw err
  }
  if (!res.ok) {
    const message = json?.error?.message ?? `Request failed with status ${res.status}`
    const err     = new Error(message)
    err.status    = res.status
    err.code      = json?.error?.code ?? 'API_ERROR'
    throw err
  }
  // Return { data, meta } so callers can access both
  return { data: json.data, meta: json.meta }
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/** GET /api/products — all products with variants
 *
 * Optional params object (all fields optional):
 *   search        string   — search by name or brand
 *   brand         string   — exact brand filter
 *   minPrice      number   — minimum selling price
 *   maxPrice      number   — maximum selling price
 *   hasNoCostEmi  boolean  — only products with a 0% plan
 *   sort          string   — price_asc|price_desc|lowest_emi|highest_cashback
 *   page          number   — page number (enables pagination)
 *   limit         number   — items per page (enables pagination)
 *
 * Returns { data: [...], meta: { count, pagination? } }
 */
export async function getProducts(params = {}) {
  const qs = new URLSearchParams()
  if (params.search       !== undefined && params.search !== '')   qs.set('search',       params.search)
  if (params.brand        !== undefined && params.brand !== '')    qs.set('brand',        params.brand)
  if (params.minPrice     !== undefined && params.minPrice !== '') qs.set('minPrice',     params.minPrice)
  if (params.maxPrice     !== undefined && params.maxPrice !== '') qs.set('maxPrice',     params.maxPrice)
  if (params.hasNoCostEmi !== undefined)                           qs.set('hasNoCostEmi', params.hasNoCostEmi)
  if (params.sort         !== undefined && params.sort !== '')     qs.set('sort',         params.sort)
  if (params.page         !== undefined)                           qs.set('page',         params.page)
  if (params.limit        !== undefined)                           qs.set('limit',        params.limit)
  const query = qs.toString()
  return requestFull(`/products${query ? '?' + query : ''}`)
}

/** GET /api/products/:slug — single product with variants + EMI plans */
export async function getProductBySlug(slug) {
  return request(`/products/${slug}`)
}

/** GET /api/products/:slug/variants */
export async function getVariants(slug) {
  return request(`/products/${slug}/variants`)
}

/** GET /api/products/:slug/emi-plans */
export async function getEmiPlans(slug) {
  return request(`/products/${slug}/emi-plans`)
}
