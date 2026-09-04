import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'
import { getProducts } from '../services/api'

// ── Constants ─────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: '',                  label: 'Relevance' },
  { value: 'price_asc',        label: 'Price: Low → High' },
  { value: 'price_desc',       label: 'Price: High → Low' },
  { value: 'lowest_emi',       label: 'Lowest EMI' },
  { value: 'highest_cashback', label: 'Highest Cashback' },
]

const DEFAULT_FILTERS = {
  search:       '',
  brand:        '',
  minPrice:     '',
  maxPrice:     '',
  hasNoCostEmi: false,
  sort:         '',
}

const PAGE_LIMIT = 6

// Simulated demo value — not a real financial figure
const DEMO_PORTFOLIO  = 370000
const DEMO_FINANCING  = 185000

function fmt(n) { return Number(n).toLocaleString('en-IN') }

function filtersAreDefault(f) {
  return (
    f.search       === DEFAULT_FILTERS.search &&
    f.brand        === DEFAULT_FILTERS.brand &&
    f.minPrice     === DEFAULT_FILTERS.minPrice &&
    f.maxPrice     === DEFAULT_FILTERS.maxPrice &&
    f.hasNoCostEmi === DEFAULT_FILTERS.hasNoCostEmi &&
    f.sort         === DEFAULT_FILTERS.sort
  )
}

// ── Active filter chips ───────────────────────────────────────────────────────

function ActiveChips({ filters, onRemove }) {
  const chips = []
  if (filters.search)       chips.push({ key: 'search',       label: `"${filters.search}"` })
  if (filters.brand)        chips.push({ key: 'brand',        label: `Brand: ${filters.brand}` })
  if (filters.minPrice)     chips.push({ key: 'minPrice',     label: `Min ₹${fmt(filters.minPrice)}` })
  if (filters.maxPrice)     chips.push({ key: 'maxPrice',     label: `Max ₹${fmt(filters.maxPrice)}` })
  if (filters.hasNoCostEmi) chips.push({ key: 'hasNoCostEmi', label: '0% EMI' })
  if (filters.sort)         chips.push({ key: 'sort',         label: SORT_OPTIONS.find(o => o.value === filters.sort)?.label ?? filters.sort })

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-3" aria-label="Active filters">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' }}
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            aria-label={`Remove ${chip.label} filter`}
            className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity leading-none focus:outline-none"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  )
}

// ── Product card ──────────────────────────────────────────────────────────────

function ProductCard({ product }) {
  const displayVariant =
    product.variants?.find((v) => v.inStock) ?? product.variants?.[0]

  const mrp      = parseFloat(product.mrp)
  const price    = parseFloat(product.price)
  const discount = mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0
  const emiFrom  = Math.ceil(price / 12)

  // Check if any variant has a no-cost plan by reading from product (not available
  // in list endpoint, but we can show based on product data)
  const withinLimit = price <= DEMO_FINANCING

  return (
    <article className="fi-card fi-card-hover overflow-hidden flex flex-col group">

      {/* ── Image area ── */}
      <div className="relative overflow-hidden" style={{ background: '#f8fafc' }}>

        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="fi-badge fi-badge-emerald">{discount}% off</span>
          )}
        </div>

        {product.brand && (
          <span
            className="absolute top-3 right-3 z-10 fi-badge fi-badge-gray"
          >
            {product.brand}
          </span>
        )}

        {/* Product image — scales slightly on hover */}
        <div className="h-48 sm:h-52 flex items-center justify-center p-5 overflow-hidden">
          {displayVariant?.imageUrl ? (
            <img
              src={displayVariant.imageUrl}
              alt={product.name}
              className="max-h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.style.removeProperty('display')
              }}
            />
          ) : null}
          <span
            className="text-6xl select-none transition-transform duration-300 group-hover:scale-105"
            style={{ color: '#e2e8f0', display: displayVariant?.imageUrl ? 'none' : undefined }}
            aria-hidden="true"
          >
            📱
          </span>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="p-5 flex flex-col flex-1 gap-3">

        {/* Product name */}
        <h2 className="text-sm font-bold leading-snug line-clamp-2 break-words" style={{ color: 'var(--color-text-primary)' }}>
          {product.name}
        </h2>

        {/* Variants count */}
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {product.variants?.length ?? 0} variant{(product.variants?.length ?? 0) !== 1 ? 's' : ''} available
        </p>

        {/* Price block */}
        <div className="mt-auto pt-3 space-y-2" style={{ borderTop: '1px solid var(--color-border)' }}>
          <p className="fi-eyebrow">Starting from</p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-extrabold fi-number" style={{ color: 'var(--color-text-primary)' }}>
              ₹{fmt(price)}
            </span>
            {mrp > price && (
              <span className="text-sm line-through" style={{ color: '#94a3b8' }}>
                ₹{fmt(mrp)}
              </span>
            )}
          </div>

          {/* EMI teaser */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="fi-badge fi-badge-emerald">0% EMI</span>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              from ₹{fmt(emiFrom)}/mo
            </span>
          </div>

          {/* Eligibility indicator */}
          {withinLimit ? (
            <p className="text-xs font-medium flex items-center gap-1" style={{ color: '#065f46' }}>
              <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Within your simulated financing limit
            </p>
          ) : (
            <p className="text-xs font-medium flex items-center gap-1" style={{ color: '#92400e' }}>
              <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Above simulated financing limit
            </p>
          )}
        </div>

        {/* CTA */}
        <Link
          to={`/products/${product.slug}`}
          className="fi-btn-primary w-full mt-1 justify-center"
        >
          View Product →
        </Link>
      </div>
    </article>
  )
}

// ── Investment Power card ─────────────────────────────────────────────────────

function InvestmentPowerCard() {
  const usedPct = Math.round((DEMO_PORTFOLIO - DEMO_FINANCING) / DEMO_PORTFOLIO * 100)
  const freePct = 100 - usedPct

  return (
    <div
      className="rounded-2xl p-5 text-white"
      style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
      aria-label="Simulated investment power card (demo)"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="fi-eyebrow" style={{ color: '#a5b4fc', fontSize: '0.65rem' }}>Investment Power</p>
          <p className="text-xl font-bold fi-number mt-0.5">₹{fmt(DEMO_PORTFOLIO)}</p>
          <p style={{ color: '#a5b4fc', fontSize: '0.7rem', marginTop: '0.125rem' }}>Portfolio Value</p>
        </div>
        <span
          className="fi-badge"
          style={{ background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.25)', fontSize: '0.6rem' }}
        >
          SIMULATION
        </span>
      </div>

      {/* Capacity bar */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: '#c7d2fe' }}>Available Financing</span>
          <span className="font-bold fi-number">₹{fmt(DEMO_FINANCING)}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${freePct}%`, background: 'var(--color-emerald)' }}
          />
        </div>
        <p style={{ color: '#a5b4fc', fontSize: '0.68rem' }}>{freePct}% simulated capacity available</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <p style={{ color: '#a5b4fc', fontSize: '0.65rem' }} className="fi-eyebrow">0% EMI</p>
          <p className="text-sm font-bold mt-0.5" style={{ color: '#6ee7b7' }}>Available</p>
        </div>
        <div className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <p style={{ color: '#a5b4fc', fontSize: '0.65rem' }} className="fi-eyebrow">Plans</p>
          <p className="text-sm font-bold mt-0.5">Up to 24 mo</p>
        </div>
      </div>
    </div>
  )
}

// ── Home page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [products,   setProducts]   = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [filters,    setFilters]    = useState({ ...DEFAULT_FILTERS })
  const [committed,  setCommitted]  = useState({ ...DEFAULT_FILTERS })
  const [page,       setPage]       = useState(1)
  const debounceRef = useRef(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit: PAGE_LIMIT }
      if (committed.search)       params.search       = committed.search
      if (committed.brand)        params.brand        = committed.brand
      if (committed.minPrice)     params.minPrice     = committed.minPrice
      if (committed.maxPrice)     params.maxPrice     = committed.maxPrice
      if (committed.hasNoCostEmi) params.hasNoCostEmi = true
      if (committed.sort)         params.sort         = committed.sort
      const { data, meta } = await getProducts(params)
      setProducts(data ?? [])
      setPagination(meta?.pagination ?? null)
    } catch (err) {
      setError(err.message ?? 'Could not load products.')
    } finally {
      setLoading(false)
    }
  }, [committed, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  function updateFilter(key, value) {
    const next = { ...filters, [key]: value }
    setFilters(next)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setPage(1); setCommitted(next) }, 300)
  }

  function removeFilter(key) {
    const next = { ...filters, [key]: DEFAULT_FILTERS[key] }
    setFilters(next)
    clearTimeout(debounceRef.current)
    setPage(1)
    setCommitted(next)
  }

  function clearAllFilters() {
    clearTimeout(debounceRef.current)
    setFilters({ ...DEFAULT_FILTERS })
    setPage(1)
    setCommitted({ ...DEFAULT_FILTERS })
  }

  function goToPage(p) {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isFiltered = !filtersAreDefault(committed)

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar />

      {/* ── Hero ── */}
      <section
        aria-label="Hero"
        style={{
          background: 'linear-gradient(135deg, var(--color-navy-deep) 0%, #1a1f3a 50%, #1e1b4b 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* Left: copy */}
            <div className="fi-fade-in">
              <p
                className="fi-eyebrow mb-4"
                style={{ color: '#818cf8', fontSize: '0.7rem' }}
              >
                Powered by 1Fi · Investment-Backed Financing
              </p>
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-4"
                style={{ color: '#f1f5f9' }}
              >
                Your investments.{' '}
                <span style={{ color: '#818cf8' }}>Your purchasing</span>{' '}
                <span style={{ color: '#6ee7b7' }}>power.</span>
              </h1>
              <p className="text-sm sm:text-base max-w-lg mb-8 leading-relaxed" style={{ color: '#94a3b8' }}>
                Explore products and see how investment-backed financing can power your
                purchases through 0% EMI — zero paperwork, no hidden charges.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <a href="#products" className="fi-btn-primary">
                  Explore Products
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
                <a
                  href="#investment-power"
                  className="fi-btn-secondary text-sm"
                  style={{ color: '#c7d2fe', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  View Investment Power
                </a>
              </div>

              {/* Flow chips */}
              <div className="flex flex-wrap gap-2 mt-8">
                {[
                  { icon: '📈', label: 'Investments' },
                  { icon: '→',  label: null, isArrow: true },
                  { icon: '⚡', label: 'Purchasing Power' },
                  { icon: '→',  label: null, isArrow: true },
                  { icon: '0%', label: 'EMI', isHighlight: true },
                ].map((item, i) =>
                  item.isArrow ? (
                    <span key={i} style={{ color: '#475569', fontSize: '0.8rem', alignSelf: 'center' }}>→</span>
                  ) : (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={item.isHighlight
                        ? { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)' }
                        : { background: 'rgba(255,255,255,0.07)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)' }
                      }
                    >
                      <span aria-hidden="true">{item.icon}</span>
                      {item.label}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Right: investment power card */}
            <div id="investment-power" className="fi-fade-in lg:justify-self-end w-full max-w-sm">
              <InvestmentPowerCard />
            </div>

          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <main id="products" className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Filter / search bar ── */}
        <div className="fi-card p-4 sm:p-5 mb-6">

          {/* Search */}
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94a3b8' }} aria-hidden="true">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search by product name or brand…"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              aria-label="Search products"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl transition-colors"
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-indigo)'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)' }}
              onBlur={(e)  => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          {/* Filters row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Min price */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold select-none" style={{ color: '#94a3b8' }}>₹</span>
              <input
                type="number"
                min="0"
                placeholder="Min price"
                value={filters.minPrice}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
                aria-label="Minimum price"
                className="w-full pl-6 pr-3 py-2.5 text-sm rounded-xl transition-colors"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--color-indigo)' }}
                onBlur={(e)  => { e.target.style.borderColor = 'var(--color-border)' }}
              />
            </div>

            {/* Max price */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold select-none" style={{ color: '#94a3b8' }}>₹</span>
              <input
                type="number"
                min="0"
                placeholder="Max price"
                value={filters.maxPrice}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                aria-label="Maximum price"
                className="w-full pl-6 pr-3 py-2.5 text-sm rounded-xl transition-colors"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--color-indigo)' }}
                onBlur={(e)  => { e.target.style.borderColor = 'var(--color-border)' }}
              />
            </div>

            {/* Sort */}
            <div>
              <select
                value={filters.sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                aria-label="Sort products"
                className="w-full px-3 py-2.5 text-sm rounded-xl transition-colors appearance-none"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* 0% EMI + clear */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none flex-1">
                <input
                  type="checkbox"
                  checked={filters.hasNoCostEmi}
                  onChange={(e) => updateFilter('hasNoCostEmi', e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: 'var(--color-indigo)' }}
                />
                <span className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>
                  0% EMI only
                </span>
              </label>

              {isFiltered && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="shrink-0 text-xs font-semibold transition-colors focus:outline-none whitespace-nowrap"
                  style={{ color: 'var(--color-error)' }}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <ActiveChips filters={committed} onRemove={removeFilter} />
        </div>

        {/* ── Results ── */}
        {loading && <Loading message="Loading products…" />}
        {error   && <ErrorMessage message={error} onRetry={fetchProducts} />}

        {!loading && !error && (
          <>
            {/* Result header */}
            <div className="flex items-center justify-between mb-5 min-w-0 gap-2">
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {isFiltered ? 'Search Results' : 'All Products'}
                </h2>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {pagination
                    ? `${pagination.total} product${pagination.total !== 1 ? 's' : ''}${isFiltered ? ' found' : ''} · page ${pagination.page} of ${pagination.totalPages}`
                    : `${products.length} product${products.length !== 1 ? 's' : ''}${isFiltered ? ' found' : ''}`
                  }
                </p>
              </div>
            </div>

            {/* Empty state */}
            {products.length === 0 && (
              <div className="fi-card flex flex-col items-center justify-center py-24 gap-4 text-center px-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: '#f1f5f9' }}
                  aria-hidden="true"
                >
                  🔍
                </div>
                <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  No products found
                </p>
                <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {isFiltered
                    ? 'No products match your current filters. Try adjusting or clearing them.'
                    : 'No products are available. Run the database seed to add products.'}
                </p>
                {isFiltered && (
                  <button type="button" onClick={clearAllFilters} className="fi-btn-primary mt-2">
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Product grid */}
            {products.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={!pagination.hasPrevPage}
                  aria-label="Previous page"
                  className="fi-btn-secondary text-sm"
                  style={!pagination.hasPrevPage ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                >
                  ← Prev
                </button>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goToPage(p)}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? 'page' : undefined}
                    className="w-9 h-9 rounded-xl text-sm font-semibold transition-all focus:outline-none"
                    style={p === page
                      ? { background: 'var(--color-indigo)', color: 'white', border: '1px solid var(--color-indigo)' }
                      : { background: 'white', color: '#475569', border: '1px solid var(--color-border)' }
                    }
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={!pagination.hasNextPage}
                  aria-label="Next page"
                  className="fi-btn-secondary text-sm"
                  style={!pagination.hasNextPage ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer
        className="mt-10 py-5 text-center text-xs"
        style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', background: 'white' }}
      >
        © {new Date().getFullYear()} 1Fi EMI Store · Investment-backed EMI financing ·{' '}
        <span style={{ color: '#94a3b8' }}>Demo / Simulation only</span>
      </footer>
    </div>
  )
}
