import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'
import ProductGallery from '../components/ProductGallery'
import ProductInfo from '../components/ProductInfo'
import EmiPlanList from '../components/EmiPlanList'
import ProceedButton from '../components/ProceedButton'
import ProceedModal from '../components/ProceedModal'
import EmiCalculator from '../components/EmiCalculator'
import BudgetRecommender from '../components/BudgetRecommender'
import { getProductBySlug } from '../services/api'

// ── Product not found ────────────────────────────────────────────────────────
function ProductNotFound({ slug }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-5 text-center px-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: '#f1f5f9' }}
        aria-hidden="true"
      >
        🔍
      </div>
      <div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Product not found
        </h2>
        <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          No product exists for{' '}
          <code
            className="px-1.5 py-0.5 rounded text-xs font-mono"
            style={{ background: '#f1f5f9', color: 'var(--color-text-primary)' }}
          >
            {slug}
          </code>.
          It may have been removed or the URL may be incorrect.
        </p>
      </div>
      <Link to="/" className="fi-btn-primary">
        ← Back to all products
      </Link>
    </div>
  )
}

// ── Section card wrapper ─────────────────────────────────────────────────────
function SectionCard({ children, className = '' }) {
  return (
    <div className={`fi-card p-5 sm:p-6 ${className}`}>
      {children}
    </div>
  )
}

// ── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
        {icon && <span className="text-base shrink-0" aria-hidden="true">{icon}</span>}
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)', marginLeft: icon ? '1.5rem' : 0 }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ProductPage() {
  const { slug } = useParams()

  const [product, setProduct]                 = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [loading, setLoading]                 = useState(true)
  const [error, setError]                     = useState(null)
  const [selectedPlan, setSelectedPlan]       = useState(null)
  const [showModal, setShowModal]             = useState(false)

  const fetchProduct = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSelectedPlan(null)
    try {
      const data = await getProductBySlug(slug)
      setProduct(data)
      const def = data.variants?.find((v) => v.inStock) ?? data.variants?.[0] ?? null
      setSelectedVariant(def)
    } catch (err) {
      if (err.status === 404 || err.code === 'PRODUCT_NOT_FOUND') {
        setError('NOT_FOUND')
      } else {
        setError(err.message ?? 'Failed to load product.')
      }
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { fetchProduct() }, [fetchProduct])

  const handleVariantSelect = (v) => {
    setSelectedVariant(v)
    setSelectedPlan(null)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {loading && <Loading message="Loading product…" />}

        {!loading && error === 'NOT_FOUND' && <ProductNotFound slug={slug} />}

        {!loading && error && error !== 'NOT_FOUND' && (
          <ErrorMessage message={error} onRetry={fetchProduct} />
        )}

        {!loading && !error && product && (
          <>
            {/* Breadcrumb */}
            <nav
              className="flex flex-wrap items-center gap-1.5 text-xs mb-5 min-w-0"
              aria-label="Breadcrumb"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Link
                to="/"
                className="transition-colors shrink-0 hover:underline"
                style={{ color: 'var(--color-indigo)' }}
              >
                Products
              </Link>
              <span aria-hidden="true" className="shrink-0" style={{ color: '#cbd5e1' }}>/</span>
              {product.brand && (
                <>
                  <span className="shrink-0">{product.brand}</span>
                  <span aria-hidden="true" className="shrink-0" style={{ color: '#cbd5e1' }}>/</span>
                </>
              )}
              <span className="font-semibold truncate min-w-0" style={{ color: 'var(--color-text-primary)' }}>
                {product.name}
              </span>
            </nav>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-6 items-start">

              {/* LEFT — sticky gallery */}
              <div className="lg:sticky lg:top-20 min-w-0">
                <ProductGallery
                  product={product}
                  variants={product.variants ?? []}
                  selectedVariant={selectedVariant}
                  onSelect={handleVariantSelect}
                />
              </div>

              {/* RIGHT — info + tools */}
              <div className="space-y-4 min-w-0">

                {/* Price + eligibility */}
                <SectionCard>
                  <ProductInfo product={product} selectedVariant={selectedVariant} />
                </SectionCard>

                {/* EMI plans */}
                <SectionCard>
                  <SectionHeader
                    icon="💳"
                    title="EMI plans backed by mutual funds"
                    subtitle="No-cost EMI available · Select a tenure below"
                  />
                  <EmiPlanList
                    slug={slug}
                    selectedPlanId={selectedPlan?.id ?? null}
                    onPlanSelect={setSelectedPlan}
                  />
                  <ProceedButton
                    selectedPlan={selectedPlan}
                    onProceed={() => setShowModal(true)}
                  />
                </SectionCard>

                {/* EMI Calculator */}
                <SectionCard>
                  <EmiCalculator productPrice={parseFloat(product.price)} />
                </SectionCard>

                {/* Budget Finder */}
                <SectionCard>
                  <BudgetRecommender plans={product.emiPlans ?? []} />
                </SectionCard>

              </div>
            </div>
          </>
        )}
      </main>

      <footer
        className="mt-12 py-5 text-center text-xs"
        style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', background: 'white' }}
      >
        © {new Date().getFullYear()} 1Fi EMI Store · Investment-backed EMI financing ·{' '}
        <span style={{ color: '#94a3b8' }}>Demo / Simulation only</span>
      </footer>

      {showModal && selectedPlan && product && selectedVariant && (
        <ProceedModal
          product={product}
          variant={selectedVariant}
          plan={selectedPlan}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
