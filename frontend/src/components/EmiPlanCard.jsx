/**
 * EmiPlanCard — single selectable EMI plan row.
 *
 * Props (unchanged contract):
 *   plan             — plan object from API
 *   isSelected       — bool
 *   isPopular        — bool — "Best Value"
 *   onSelect         — () => void
 *   isCompared       — bool (Feature 2)
 *   onCompareToggle  — () => void (Feature 2)
 *   compareDisabled  — bool (Feature 2)
 */
export default function EmiPlanCard({
  plan,
  isSelected,
  isPopular,
  onSelect,
  isCompared      = false,
  onCompareToggle = null,
  compareDisabled = false,
}) {
  const monthly  = parseFloat(plan.monthlyPayment)
  const total    = parseFloat(plan.totalPayable)
  const cashback = plan.cashback ? parseFloat(plan.cashback) : null
  const rate     = parseFloat(plan.interestRate)

  return (
    <div className="relative">

      {/* Best Value banner */}
      {isPopular && (
        <div
          className="rounded-t-xl text-xs font-bold text-center py-1 tracking-wide"
          style={{ background: 'var(--color-indigo)', color: 'white' }}
        >
          ★ Best Value
        </div>
      )}

      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isSelected}
        className="w-full text-left transition-all duration-150 focus:outline-none"
        style={{
          borderRadius: isPopular ? '0 0 0.75rem 0.75rem' : '0.75rem',
          border: isSelected
            ? '2px solid var(--color-indigo)'
            : isPopular
            ? '2px solid #c7d2fe'
            : '1px solid var(--color-border)',
          background: isSelected ? '#eef2ff' : 'white',
          boxShadow: isSelected ? '0 2px 8px rgba(79,70,229,0.15)' : 'none',
          outline: 'none',
        }}
        onFocus={(e) => {
          if (!isSelected) e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.15)'
        }}
        onBlur={(e) => {
          if (!isSelected) e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div className="p-3 sm:p-4">
          <div className="flex items-start gap-3">

            {/* Radio circle */}
            <div
              style={{
                width: 18, height: 18, flexShrink: 0, marginTop: 3,
                borderRadius: '50%',
                border: isSelected ? '2px solid var(--color-indigo)' : '2px solid #cbd5e1',
                background: isSelected ? 'var(--color-indigo)' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 150ms ease',
              }}
              aria-hidden="true"
            >
              {isSelected && (
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'white' }} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1.5">

              {/* Tenure + amount */}
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  className="text-base sm:text-lg font-bold fi-number leading-tight"
                  style={{ color: isSelected ? 'var(--color-indigo)' : 'var(--color-text-primary)' }}
                >
                  ₹{monthly.toLocaleString('en-IN')}
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  × {plan.tenureMonths} months
                </span>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-1.5">
                {plan.isNoCost ? (
                  <span className="fi-badge fi-badge-emerald">0% Interest</span>
                ) : (
                  <span className="fi-badge fi-badge-amber">{rate.toFixed(1)}% p.a.</span>
                )}

                {cashback && (
                  <span className="fi-badge fi-badge-violet">
                    Cashback ₹{cashback.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {/* Total + fund */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                <span className="text-xs fi-number" style={{ color: '#94a3b8' }}>
                  Total ₹{total.toLocaleString('en-IN')}
                </span>
                {plan.fundName && (
                  <span className="flex items-center gap-1 min-w-0 text-xs" style={{ color: '#94a3b8' }}>
                    <span aria-hidden="true" className="shrink-0">🏦</span>
                    <span className="truncate">{plan.fundName}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Checkmark when selected */}
            {isSelected && (
              <div
                className="shrink-0 flex items-center justify-center mt-0.5"
                style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--color-indigo)' }}
              >
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

          </div>
        </div>
      </button>

      {/* Compare toggle (Feature 2 — unchanged contract) */}
      {onCompareToggle && (
        <div className="flex justify-end px-3 pb-2 -mt-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCompareToggle() }}
            disabled={compareDisabled}
            aria-pressed={isCompared}
            aria-label={
              isCompared
                ? `Remove ${plan.tenureMonths}-month plan from comparison`
                : compareDisabled
                ? 'Maximum 3 plans can be compared'
                : `Add ${plan.tenureMonths}-month plan to comparison`
            }
            className="text-xs font-semibold px-2 py-0.5 rounded-md border transition-all duration-150 focus:outline-none"
            style={
              isCompared
                ? { borderColor: '#818cf8', background: '#eef2ff', color: '#3730a3' }
                : compareDisabled
                ? { borderColor: '#e2e8f0', color: '#cbd5e1', cursor: 'not-allowed' }
                : { borderColor: '#e2e8f0', color: '#64748b' }
            }
          >
            {isCompared ? '✓ Comparing' : '+ Compare'}
          </button>
        </div>
      )}

    </div>
  )
}
