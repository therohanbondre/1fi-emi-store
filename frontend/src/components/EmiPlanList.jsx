import { useState, useEffect, useCallback } from 'react'
import EmiPlanCard from './EmiPlanCard'
import EmiComparison from './EmiComparison'
import ErrorMessage from './ErrorMessage'
import { getEmiPlans } from '../services/api'

const MAX_COMPARE = 3

export default function EmiPlanList({ slug, selectedPlanId, onPlanSelect }) {
  const [plans, setPlans]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [comparedIds, setComparedIds] = useState(() => new Set())

  const fetchPlans = useCallback(async () => {
    if (!slug) return
    setLoading(true)
    setError(null)
    try {
      setPlans(await getEmiPlans(slug))
    } catch (err) {
      setError(err.message ?? 'Failed to load EMI plans.')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { fetchPlans() }, [fetchPlans])
  useEffect(() => { setComparedIds(new Set()) }, [slug])

  function handleCompareToggle(planId) {
    setComparedIds((prev) => {
      const next = new Set(prev)
      if (next.has(planId)) { next.delete(planId) }
      else { if (next.size >= MAX_COMPARE) return prev; next.add(planId) }
      return next
    })
  }

  function handleRemoveFromCompare(planId) {
    setComparedIds((prev) => { const next = new Set(prev); next.delete(planId); return next })
  }

  function handleClearCompare() { setComparedIds(new Set()) }

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading EMI plans">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl p-4 animate-pulse"
            style={{ border: '1px solid var(--color-border)', background: 'white' }}
          >
            <div className="flex gap-3">
              <div className="rounded-full shrink-0 mt-0.5" style={{ width: 18, height: 18, background: '#e2e8f0' }} />
              <div className="flex-1 space-y-2.5">
                <div className="h-5 w-40 rounded" style={{ background: '#e2e8f0' }} />
                <div className="flex gap-2">
                  <div className="h-4 w-20 rounded-md" style={{ background: '#f1f5f9' }} />
                  <div className="h-4 w-36 rounded-md" style={{ background: '#f1f5f9' }} />
                </div>
                <div className="h-3 w-52 rounded" style={{ background: '#f1f5f9' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) return <ErrorMessage message={error} onRetry={fetchPlans} />

  if (plans.length === 0) {
    return (
      <p className="text-center text-sm py-8" style={{ color: 'var(--color-text-secondary)' }}>
        No EMI plans available for this product.
      </p>
    )
  }

  // Best Value logic
  const noCost = plans.filter((p) => p.isNoCost)
  let bestId   = null
  if (noCost.length > 0) {
    bestId = (noCost.find((p) => p.tenureMonths === 6) ??
              noCost.reduce((a, b) => a.tenureMonths >= b.tenureMonths ? a : b)).id
  } else {
    bestId = plans.reduce((a, b) =>
      parseFloat(a.interestRate) <= parseFloat(b.interestRate) ? a : b).id
  }

  const comparedPlans = plans
    .filter((p) => comparedIds.has(p.id))
    .sort((a, b) => a.tenureMonths - b.tenureMonths)

  const atLimit = comparedIds.size >= MAX_COMPARE

  return (
    <div>
      {/* Hint row */}
      <div className="flex items-center justify-between mb-3 min-w-0 gap-2">
        <p className="text-xs shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
          {plans.length} plan{plans.length !== 1 ? 's' : ''} available
        </p>
        {comparedIds.size === 0 ? (
          <p className="text-xs text-right min-w-0" style={{ color: 'var(--color-text-secondary)' }}>
            Tap <span className="font-semibold" style={{ color: 'var(--color-indigo)' }}>+ Compare</span> to compare plans
          </p>
        ) : (
          <p className="text-xs font-semibold shrink-0" style={{ color: 'var(--color-indigo)' }}>
            {comparedIds.size}/{MAX_COMPARE} selected
          </p>
        )}
      </div>

      {/* Plan cards */}
      <div className="space-y-2.5">
        {plans.map((plan) => (
          <EmiPlanCard
            key={plan.id}
            plan={plan}
            isSelected={plan.id === selectedPlanId}
            isPopular={plan.id === bestId}
            onSelect={() => onPlanSelect(plan)}
            isCompared={comparedIds.has(plan.id)}
            onCompareToggle={() => handleCompareToggle(plan.id)}
            compareDisabled={atLimit && !comparedIds.has(plan.id)}
          />
        ))}
      </div>

      {/* Comparison panel */}
      {comparedPlans.length >= 2 && (
        <EmiComparison
          plans={comparedPlans}
          onRemove={handleRemoveFromCompare}
          onClear={handleClearCompare}
        />
      )}

      {comparedIds.size === 1 && (
        <p className="mt-3 text-xs text-center" style={{ color: 'var(--color-indigo)' }}>
          Select 1 more plan to start comparing
        </p>
      )}
    </div>
  )
}
