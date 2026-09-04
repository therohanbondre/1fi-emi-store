import { useState, useMemo } from 'react'
import { getRecommendations, classifyPlan } from '../utils/budgetRecommender'

/**
 * BudgetRecommender — "What's your monthly budget?" feature.
 *
 * Props:
 *   plans — array of EMI plan objects from product.emiPlans (no extra API call)
 *
 * This component is purely presentational + local state.
 * It never calls the API; it works entirely from the plans prop.
 * Existing EMI selection (EmiPlanList + EmiPlanCard) is completely untouched.
 */

// ── Quick-pick budget chips ───────────────────────────────────────────────────
const BUDGET_CHIPS = [5000, 8000, 10000, 15000, 20000, 25000]

// ── Format helpers ────────────────────────────────────────────────────────────

function fmt(val) {
  const n = parseFloat(val)
  if (!Number.isFinite(n)) return '—'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

function fmtRate(rate, isNoCost) {
  if (isNoCost || parseFloat(rate) === 0) return '0% (No-cost)'
  return parseFloat(rate).toFixed(1) + '% p.a.'
}

// ── Badge component ───────────────────────────────────────────────────────────

function PlanBadge({ type }) {
  if (type === 'recommended') {
    return (
      <span className="fi-badge fi-badge-emerald" style={{ fontSize: '0.6rem' }}>
        ★ Recommended
      </span>
    )
  }
  if (type === 'fits') {
    return (
      <span className="fi-badge fi-badge-indigo" style={{ fontSize: '0.6rem' }}>
        ✓ Fits budget
      </span>
    )
  }
  return null
}

// ── Single plan row inside the result list ────────────────────────────────────

function PlanRow({ plan, type }) {
  const monthly   = parseFloat(plan.monthlyPayment)
  const total     = parseFloat(plan.totalPayable)
  const cashback  = plan.cashback ? parseFloat(plan.cashback) : 0
  const effective = total - cashback

  return (
    <div
      className="rounded-xl p-3 sm:p-4 transition-all"
      style={type === 'recommended'
        ? { border: '1px solid #a7f3d0', background: 'var(--color-mint-soft)' }
        : { border: '1px solid var(--color-border)', background: 'white' }
      }
    >
      {/* Top row: tenure + badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
        <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {plan.tenureMonths} months
        </span>
        <PlanBadge type={type} />
        {plan.isNoCost && (
          <span className="fi-badge fi-badge-emerald" style={{ fontSize: '0.6rem' }}>0% Interest</span>
        )}
        {cashback > 0 && (
          <span className="fi-badge fi-badge-violet" style={{ fontSize: '0.6rem' }}>
            Cashback {fmt(cashback)}
          </span>
        )}
      </div>

      {/* Grid of key figures */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div>
          <p className="fi-eyebrow mb-0.5" style={{ fontSize: '0.6rem' }}>Monthly EMI</p>
          <p className="font-bold fi-number" style={{ color: 'var(--color-text-primary)' }}>{fmt(monthly)}</p>
        </div>
        <div>
          <p className="fi-eyebrow mb-0.5" style={{ fontSize: '0.6rem' }}>Interest</p>
          <p className="font-semibold fi-number" style={{ color: plan.isNoCost ? 'var(--color-success)' : '#d97706' }}>
            {fmtRate(plan.interestRate, plan.isNoCost)}
          </p>
        </div>
        <div>
          <p className="fi-eyebrow mb-0.5" style={{ fontSize: '0.6rem' }}>Total payable</p>
          <p className="font-semibold fi-number" style={{ color: 'var(--color-text-secondary)' }}>{fmt(total)}</p>
        </div>
        <div>
          <p className="fi-eyebrow mb-0.5" style={{ fontSize: '0.6rem' }}>Effective cost</p>
          <p
            className="font-semibold fi-number"
            style={{ color: type === 'recommended' ? 'var(--color-success)' : 'var(--color-text-primary)' }}
          >
            {fmt(effective)}
          </p>
        </div>
      </div>

      {/* Recommended reason */}
      {type === 'recommended' && plan._reason && (
        <p className="mt-2 text-xs font-medium leading-relaxed" style={{ color: '#065f46' }}>
          💡 {plan._reason}
        </p>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BudgetRecommender({ plans }) {
  const [budgetInput, setBudgetInput] = useState('')
  const [submitted,   setSubmitted]   = useState(false)

  const budgetNum = parseFloat(budgetInput) || 0

  // Run recommendation logic — recomputes whenever budget or plans change
  const result = useMemo(() => {
    if (!submitted || budgetNum <= 0) return null
    return getRecommendations(plans, budgetNum)
  }, [plans, budgetNum, submitted])

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleBudgetChange(e) {
    const raw = e.target.value.replace(/[^\d]/g, '')
    setBudgetInput(raw)
    // Re-trigger instantly as the user types (live update)
    setSubmitted(raw.length > 0)
  }

  function handleChipClick(value) {
    setBudgetInput(String(value))
    setSubmitted(true)
  }

  function handleClear() {
    setBudgetInput('')
    setSubmitted(false)
  }

  // Attach the reason string to the recommended plan so PlanRow can display it
  const plansWithReason = useMemo(() => {
    if (!result?.recommended) return result?.matching ?? []
    return (result.matching ?? []).map((p) =>
      p.id === result.recommended.id
        ? { ...p, _reason: result.recommendReason }
        : p
    )
  }, [result])

  // ── Early return when no plans loaded yet ───────────────────────────────────
  if (!plans || plans.length === 0) return null

  return (
    <div>

      {/* ── Section header ── */}
      <div className="mb-5">
        <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <span className="text-base" aria-hidden="true">💰</span>
          Monthly Budget Finder
        </h2>
        <p className="text-xs mt-0.5 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
          Enter your monthly budget to find the best matching EMI plan
        </p>
      </div>

      {/* ── Budget input ── */}
      <div>
        <label htmlFor="budget-input" className="fi-eyebrow block mb-1.5">
          Your Monthly Budget
        </label>

        {/* Text input */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold select-none" style={{ color: 'var(--color-text-secondary)' }}>₹</span>
          <input
            id="budget-input"
            type="text"
            inputMode="numeric"
            value={budgetInput ? Number(budgetInput).toLocaleString('en-IN') : ''}
            onChange={handleBudgetChange}
            placeholder="e.g. 10,000"
            aria-label="Monthly budget in rupees"
            className="w-full pl-7 pr-4 py-2.5 text-sm font-semibold rounded-xl transition-colors"
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

        {/* Quick-pick chips */}
        <div className="flex flex-wrap gap-2 mt-2.5">
          {BUDGET_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChipClick(chip)}
              aria-pressed={budgetNum === chip}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 focus-visible:ring-2"
              style={budgetNum === chip
                ? { border: '1px solid var(--color-indigo)', background: 'var(--color-indigo)', color: 'white' }
                : { border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', background: 'white' }
              }
            >
              ₹{chip.toLocaleString('en-IN')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results ── */}
      {result && (
        <div className="mt-5">
          <div className="fi-divider" />

          {/* ── Case 1: plans match the budget ── */}
          {result.matching.length > 0 && (
            <>
              {/* Summary line */}
              <div className="flex items-center justify-between mb-3 min-w-0 gap-2">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {result.matching.length} plan{result.matching.length !== 1 ? 's' : ''} fit{result.matching.length === 1 ? 's' : ''} your budget
                </p>
                <p className="text-xs shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                  Budget: <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{fmt(result.budget)}</span>/mo
                </p>
              </div>

              {/* Plan rows */}
              <div className="space-y-2.5">
                {plansWithReason.map((plan) => {
                  const type = classifyPlan(plan, result.budget, result.recommended?.id)
                  return <PlanRow key={plan.id} plan={plan} type={type} />
                })}
              </div>

              {/* Lowest total cost callout */}
              {result.matching.length > 1 && result.recommended && (
                <div
                  className="mt-3 rounded-xl px-4 py-3 flex items-start gap-2"
                  style={{ background: 'var(--color-mint-soft)', border: '1px solid #a7f3d0' }}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold" style={{ color: '#065f46' }}>
                      Lowest total cost
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#065f46', opacity: 0.85 }}>
                      The {result.recommended.tenureMonths}-month plan costs you the least overall
                      (₹{Math.round(parseFloat(result.recommended.totalPayable) - (result.recommended.cashback ? parseFloat(result.recommended.cashback) : 0)).toLocaleString('en-IN')} effective).
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Case 2: no plans match — show closest ── */}
          {result.matching.length === 0 && (
            <div className="space-y-4">

              {/* No-match message */}
              <div
                className="rounded-xl px-4 py-3 flex items-start gap-2"
                style={{ background: '#fffbeb', border: '1px solid #fcd34d' }}
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold" style={{ color: '#92400e' }}>
                    No EMI plan fits your budget of {fmt(result.budget)}/mo
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#92400e', opacity: 0.85 }}>
                    The cheapest available plan starts at{' '}
                    <span className="font-semibold">
                      {result.closest ? fmt(result.closest.monthlyPayment) : '—'}/mo
                    </span>.
                    Try increasing your budget or choose a longer tenure.
                  </p>
                </div>
              </div>

              {/* Closest plan */}
              {result.closest && (
                <>
                  <p className="fi-eyebrow">Closest available plan</p>
                  <div
                    className="rounded-xl p-3 sm:p-4"
                    style={{ border: '1px solid #fcd34d', background: 'white' }}
                  >
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        {result.closest.tenureMonths} months
                      </span>
                      {result.closest.isNoCost && (
                        <span className="fi-badge fi-badge-emerald" style={{ fontSize: '0.6rem' }}>0% Interest</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="fi-eyebrow mb-0.5" style={{ fontSize: '0.6rem' }}>Monthly EMI</p>
                        <p className="font-bold fi-number" style={{ color: 'var(--color-text-primary)' }}>{fmt(result.closest.monthlyPayment)}</p>
                      </div>
                      <div>
                        <p className="fi-eyebrow mb-0.5" style={{ fontSize: '0.6rem' }}>Over budget by</p>
                        <p className="font-semibold fi-number" style={{ color: 'var(--color-warning)' }}>
                          {fmt(parseFloat(result.closest.monthlyPayment) - result.budget)}
                        </p>
                      </div>
                      <div>
                        <p className="fi-eyebrow mb-0.5" style={{ fontSize: '0.6rem' }}>Total payable</p>
                        <p className="font-semibold fi-number" style={{ color: 'var(--color-text-secondary)' }}>{fmt(result.closest.totalPayable)}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Clear link */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs transition-colors focus:outline-none focus-visible:underline"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Clear budget
            </button>
          </div>
        </div>
      )}

      {/* Empty state — no budget entered yet */}
      {!result && (
        <p className="mt-4 text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
          Enter your monthly budget above to see which plans you qualify for
        </p>
      )}

    </div>
  )
}
