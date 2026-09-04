// productController.js
// HTTP layer only — reads req, calls the service, shapes the response.
// No Prisma imports. No business logic. No raw SQL.

import * as productService from '../services/productService.js'

// ---------------------------------------------------------------------------
// Configuration constants
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 10    // items per page when ?limit is not supplied
const MAX_LIMIT     = 100   // hard cap — prevents a caller from requesting all rows

// ---------------------------------------------------------------------------
// Response helper
// ---------------------------------------------------------------------------

function ok(res, data, meta = undefined, status = 200) {
  const body = { success: true, data }
  if (meta !== undefined) body.meta = meta
  return res.status(status).json(body)
}

// ---------------------------------------------------------------------------
// Query-parameter validation
// ---------------------------------------------------------------------------

const VALID_SORTS = new Set([
  'price_asc',
  'price_desc',
  'lowest_emi',
  'highest_cashback',
  'name_asc',
])

/**
 * Parse and validate all query parameters for GET /api/products.
 * Returns { params, errors }.
 *
 * Pagination behaviour:
 *   • No ?page / ?limit  →  params.paginate = false, returns ALL products
 *                           (backwards compatible with original behaviour)
 *   • ?page or ?limit    →  params.paginate = true, uses DEFAULT_LIMIT if
 *                           limit is omitted but page is provided
 */
function parseListParams(query) {
  const params = { paginate: false }
  const errors = []

  // ── Text filters ──────────────────────────────────────────────────────────

  if (query.search !== undefined) {
    const s = String(query.search).trim()
    if (s.length > 100) errors.push('search must be 100 characters or fewer')
    else if (s.length > 0) params.search = s
  }

  if (query.brand !== undefined) {
    const b = String(query.brand).trim()
    if (b.length > 100) errors.push('brand must be 100 characters or fewer')
    else if (b.length > 0) params.brand = b
  }

  // ── Price filters ─────────────────────────────────────────────────────────

  if (query.minPrice !== undefined) {
    const v = Number(query.minPrice)
    if (!Number.isFinite(v) || v < 0) errors.push('minPrice must be a non-negative number')
    else params.minPrice = v
  }

  if (query.maxPrice !== undefined) {
    const v = Number(query.maxPrice)
    if (!Number.isFinite(v) || v < 0) errors.push('maxPrice must be a non-negative number')
    else params.maxPrice = v
  }

  if (
    params.minPrice !== undefined &&
    params.maxPrice !== undefined &&
    params.minPrice > params.maxPrice
  ) {
    errors.push('minPrice must not be greater than maxPrice')
  }

  // ── Boolean filter ────────────────────────────────────────────────────────

  if (query.hasNoCostEmi !== undefined) {
    const raw = String(query.hasNoCostEmi).toLowerCase()
    if (raw === 'true')       params.hasNoCostEmi = true
    else if (raw === 'false') params.hasNoCostEmi = false
    else errors.push('hasNoCostEmi must be "true" or "false"')
  }

  // ── Sort ──────────────────────────────────────────────────────────────────

  if (query.sort !== undefined) {
    const s = String(query.sort).trim().toLowerCase()
    if (!VALID_SORTS.has(s)) {
      errors.push(`sort must be one of: ${[...VALID_SORTS].join(', ')}`)
    } else {
      params.sort = s
    }
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  //
  // We opt into pagination only when the caller passes ?page or ?limit.
  // This preserves full backwards compatibility for callers that expect
  // all products without a pagination envelope.

  const hasPaginationParam =
    query.page !== undefined || query.limit !== undefined

  if (hasPaginationParam) {
    params.paginate = true

    // page — positive integer, defaults to 1
    if (query.page !== undefined) {
      const v = Number(query.page)
      if (!Number.isFinite(v) || !Number.isInteger(v) || v < 1) {
        errors.push('page must be a positive integer')
      } else {
        params.page = v
      }
    } else {
      params.page = 1
    }

    // limit — positive integer, capped at MAX_LIMIT, defaults to DEFAULT_LIMIT
    if (query.limit !== undefined) {
      const v = Number(query.limit)
      if (!Number.isFinite(v) || !Number.isInteger(v) || v < 1) {
        errors.push('limit must be a positive integer')
      } else if (v > MAX_LIMIT) {
        errors.push(`limit must not exceed ${MAX_LIMIT}`)
      } else {
        params.limit = v
      }
    } else {
      params.limit = DEFAULT_LIMIT
    }
  }

  return { params, errors }
}

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

/**
 * GET /api/products
 *
 * Filter params (all optional, from Feature 4):
 *   search, brand, minPrice, maxPrice, hasNoCostEmi, sort
 *
 * Pagination params (both optional):
 *   page   — positive integer, default 1
 *   limit  — positive integer 1–100, default 10
 *
 * When neither page nor limit is passed, all matching products are returned
 * (backwards compatible). When either is passed, a paginated response with
 * meta.pagination is returned.
 *
 * Paginated meta shape:
 *   {
 *     count:      N,   — products on this page
 *     pagination: {
 *       total:      N, — total matching records
 *       totalPages: N,
 *       page:       N,
 *       limit:      N,
 *       hasNextPage:    bool,
 *       hasPrevPage:    bool,
 *     }
 *   }
 */
export async function listProducts(req, res, next) {
  try {
    const { params, errors } = parseListParams(req.query)

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code:    'INVALID_QUERY_PARAMS',
          message: errors.join('; '),
          details: errors,
        },
      })
    }

    const { products, total } = await productService.getAllProducts(params)

    if (!params.paginate) {
      // ── Non-paginated response (backwards compatible) ──────────────────
      return ok(res, products, { count: products.length })
    }

    // ── Paginated response ─────────────────────────────────────────────────
    const { page, limit } = params
    const totalPages = Math.max(1, Math.ceil(total / limit))

    return ok(res, products, {
      count: products.length,
      pagination: {
        total,
        totalPages,
        page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/products/:slug
 */
export async function getProduct(req, res, next) {
  try {
    const product = await productService.getProductBySlug(req.params.slug)
    return ok(res, product)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/products/:slug/variants
 */
export async function listVariants(req, res, next) {
  try {
    const variants = await productService.getVariantsBySlug(req.params.slug)
    return ok(res, variants, { count: variants.length })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/products/:slug/emi-plans
 */
export async function listEmiPlans(req, res, next) {
  try {
    const plans = await productService.getEmiPlansBySlug(req.params.slug)
    return ok(res, plans, { count: plans.length })
  } catch (err) {
    next(err)
  }
}
