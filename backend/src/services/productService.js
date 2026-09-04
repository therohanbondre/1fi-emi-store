// productService.js
// Pure data-access layer — no Express, no res/req, no status codes.
// All Prisma queries live here. Controllers call these functions.

import prisma from '../lib/prisma.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Validate that a slug is a safe URL-safe string before querying.
 * Accepts lowercase letters, digits, and hyphens only.
 * Throws a 400 if the slug looks malformed.
 */
function validateSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    const err = new Error('Product slug is required')
    err.status = 400
    err.code   = 'INVALID_SLUG'
    throw err
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    const err = new Error(`Invalid product slug: "${slug}"`)
    err.status = 400
    err.code   = 'INVALID_SLUG'
    throw err
  }
}

/**
 * Throw a structured 404 error that the error-handler middleware understands.
 */
function notFoundError(slug) {
  const err = new Error(`No product found with slug "${slug}"`)
  err.status = 404
  err.code   = 'PRODUCT_NOT_FOUND'
  return err
}

// Shared orderBy / include options so every query is consistent.
const VARIANT_ORDER = { orderBy: { sortOrder: 'asc' } }
const PLAN_ORDER    = { orderBy: { tenureMonths: 'asc' } }

// ---------------------------------------------------------------------------
// getAllProducts — with optional search / filter / sort / pagination
//
// Accepted params (all optional, validated by the controller):
//   search       string  — case-insensitive substring on name OR brand
//   brand        string  — exact brand match (case-insensitive)
//   minPrice     number  — selling price >= minPrice
//   maxPrice     number  — selling price <= maxPrice
//   hasNoCostEmi boolean — only products with ≥1 isNoCost plan
//   sort         string  — 'price_asc'|'price_desc'|'lowest_emi'|'highest_cashback'
//   page         number  — 1-based page number (default: 1)
//   limit        number  — items per page (undefined = no limit = all)
//
// Returns:
//   { products: [...], total: N }
//   where total is the count of ALL matching records (before pagination),
//   so the controller can compute totalPages.
// ---------------------------------------------------------------------------

export async function getAllProducts(params = {}) {
  const {
    search,
    brand,
    minPrice,
    maxPrice,
    hasNoCostEmi,
    sort  = 'name_asc',
    page  = 1,
    limit,              // undefined = no limit
  } = params

  const needsPagination = limit !== undefined && limit > 0

  // ── Build Prisma WHERE clause ────────────────────────────────────────────

  const where = {}

  if (search && search.trim() !== '') {
    where.OR = [
      { name:  { contains: search.trim(), mode: 'insensitive' } },
      { brand: { contains: search.trim(), mode: 'insensitive' } },
    ]
  }

  if (brand && brand.trim() !== '') {
    where.brand = { equals: brand.trim(), mode: 'insensitive' }
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {}
    if (minPrice !== undefined) where.price.gte = minPrice
    if (maxPrice !== undefined) where.price.lte = maxPrice
  }

  if (hasNoCostEmi === true) {
    where.emiPlans = { some: { isNoCost: true } }
  }

  // ── Determine prismaOrderBy ──────────────────────────────────────────────

  const needsJsSort  = sort === 'lowest_emi' || sort === 'highest_cashback'
  let   prismaOrderBy = { name: 'asc' }
  if (sort === 'price_asc')  prismaOrderBy = { price: 'asc' }
  if (sort === 'price_desc') prismaOrderBy = { price: 'desc' }

  // ── Count total matching records (for pagination meta) ───────────────────

  const total = await prisma.product.count({ where })

  // ── Fetch products ───────────────────────────────────────────────────────
  //
  // Strategy:
  //   A) price/name sort: Prisma handles order, we apply skip/take directly.
  //   B) EMI-based sort:  fetch ALL matching products (with emiPlans for sort),
  //      sort in JS, slice the page, then re-fetch just that page's IDs with
  //      full variant/emiPlan includes. This keeps DB pagination correct while
  //      supporting cross-table sorts that Prisma can't do natively.

  let products

  if (!needsJsSort) {
    // ── Path A: DB-level ordering + pagination ────────────────────────────
    products = await prisma.product.findMany({
      where,
      include: { variants: VARIANT_ORDER },
      orderBy: prismaOrderBy,
      ...(needsPagination ? { skip: (page - 1) * limit, take: limit } : {}),
    })
  } else {
    // ── Path B: JS sort then paginate ─────────────────────────────────────
    // Step 1: fetch all matching IDs + the field(s) needed to sort
    const forSort = await prisma.product.findMany({
      where,
      select: {
        id:       true,
        emiPlans: { select: { monthlyPayment: true, cashback: true } },
      },
      orderBy: { name: 'asc' },   // stable secondary sort
    })

    // Step 2: sort in JS
    if (sort === 'lowest_emi') {
      forSort.sort((a, b) => {
        const aMin = a.emiPlans.length
          ? Math.min(...a.emiPlans.map((p) => parseFloat(p.monthlyPayment)))
          : Infinity
        const bMin = b.emiPlans.length
          ? Math.min(...b.emiPlans.map((p) => parseFloat(p.monthlyPayment)))
          : Infinity
        return aMin - bMin
      })
    } else {
      // highest_cashback
      forSort.sort((a, b) => {
        const aMax = a.emiPlans.length
          ? Math.max(...a.emiPlans.map((p) => parseFloat(p.cashback ?? 0)))
          : 0
        const bMax = b.emiPlans.length
          ? Math.max(...b.emiPlans.map((p) => parseFloat(p.cashback ?? 0)))
          : 0
        return bMax - aMax
      })
    }

    // Step 3: slice to the requested page
    const sliced = needsPagination
      ? forSort.slice((page - 1) * limit, page * limit)
      : forSort

    const pageIds = sliced.map((p) => p.id)

    if (pageIds.length === 0) {
      products = []
    } else {
      // Step 4: fetch full data for just these IDs, preserving JS sort order
      const rows = await prisma.product.findMany({
        where:   { id: { in: pageIds } },
        include: { variants: VARIANT_ORDER },
      })
      // Re-apply the JS sort order (findMany with `in` doesn't preserve order)
      const idx = Object.fromEntries(pageIds.map((id, i) => [id, i]))
      products = rows.sort((a, b) => idx[a.id] - idx[b.id])
    }
  }

  return { products, total }
}

// ---------------------------------------------------------------------------
// Remaining service methods — unchanged
// ---------------------------------------------------------------------------

/**
 * Return a single product with variants AND EMI plans.
 * Throws 400 for invalid slug format, 404 if not found.
 */
export async function getProductBySlug(slug) {
  validateSlug(slug)
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      variants: VARIANT_ORDER,
      emiPlans: PLAN_ORDER,
    },
  })
  if (!product) throw notFoundError(slug)
  return product
}

/**
 * Return only the variants for a product.
 * Throws 400 for invalid slug format, 404 if not found.
 */
export async function getVariantsBySlug(slug) {
  validateSlug(slug)
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id:       true,
      name:     true,
      slug:     true,
      variants: VARIANT_ORDER,
    },
  })
  if (!product) throw notFoundError(slug)
  return product.variants
}

/**
 * Return only the EMI plans for a product.
 * Throws 400 for invalid slug format, 404 if not found.
 */
export async function getEmiPlansBySlug(slug) {
  validateSlug(slug)
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id:       true,
      name:     true,
      slug:     true,
      emiPlans: PLAN_ORDER,
    },
  })
  if (!product) throw notFoundError(slug)
  return product.emiPlans
}
