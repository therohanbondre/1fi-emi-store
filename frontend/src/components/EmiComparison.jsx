/**
 * EmiComparison — side-by-side comparison panel for up to 3 EMI plans.
 * Logic unchanged. Styling updated to use the design system.
 */

function fmt(n) {
  const num = parseFloat(n)
  if (!Number.isFinite(num)) return '—'
  return '₹' + Math.round(num).toLocaleString('en-IN')
}

function fmtRate(rate, isNoCost) {
  if (isNoCost || parseFloat(rate) === 0) return '0% (No-cost)'
  return parseFloat(rate).toFixed(1) + '% p.a.'
}

function winners(plans, accessor, prefer = 'min') {
  if (plans.length === 0) return new Set()
  const values = plans.map((p) => accessor(p))
  const target = prefer === 'min' ? Math.min(...values) : Math.max(...values)
  return new Set(plans.filter((p) => accessor(p) === target).map((p) => p.id))
}

function CompareRow({ label, values }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
      <td
        className="py-3 pr-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap align-middle"
        style={{ color: 'var(--color-text-secondary)', width: '7rem' }}
      >
        {label}
      </td>
      {values.map(({ key, content, highlight, isWinner }) => (
        <td key={key} className="py-3 px-2 text-center align-middle">
          <span
            className="text-sm font-semibold fi-number"
            style={{ color: isWinner ? 'var(--color-success)' : highlight || 'var(--color-text-primary)' }}
          >
            {content}
          </span>
        </td>
      ))}
      {Array.from({ length: 3 - values.length }).map((_, i) => (
        <td key={`empty-${i}`} className="py-3 px-2" />
      ))}
    </tr>
  )
}

export default function EmiComparison({ plans, onRemove, onClear }) {
  if (!plans || plans.length < 2) return null

  const lowestMonthly   = winners(plans, (p) => parseFloat(p.monthlyPayment))
  const lowestEffective = winners(plans, (p) => {
    const cb = p.cashback ? parseFloat(p.cashback) : 0
    return parseFloat(p.totalPayable) - cb
  })
  const highestCashback = winners(
    plans.filter((p) => p.cashback && parseFloat(p.cashback) > 0),
    (p) => parseFloat(p.cashback),
    'max',
  )

  const effectiveCost = (p) => parseFloat(p.totalPayable) - (p.cashback ? parseFloat(p.cashback) : 0)

  return (
    <div
      className="mt-5 rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--color-border)', background: 'white' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}
      >
        <div className="min-w-0">
          <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Comparing {plans.length} plan{plans.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Green highlights = best value in each category
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 text-xs font-semibold ml-4 transition-colors focus:outline-none focus-visible:underline"
          style={{ color: 'var(--color-error)' }}
        >
          Clear all
        </button>
      </div>

      {/* Table — scrolls horizontally on narrow screens */}
      <div className="overflow-x-auto px-4 pb-4">
        <table className="w-full" style={{ minWidth: '340px' }}>
          <thead>
            <tr>
              <th style={{ width: '7rem' }} />
              {plans.map((plan) => (
                <th key={plan.id} className="py-3 px-2 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-sm font-extrabold fi-number" style={{ color: 'var(--color-text-primary)' }}>
                      {plan.tenureMonths} mo
                    </span>
                    {plan.isNoCost && (
                      <span className="fi-badge fi-badge-emerald" style={{ fontSize: '0.6rem' }}>
                        0% Interest
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemove(plan.id)}
                      aria-label={`Remove ${plan.tenureMonths}-month plan from comparison`}
                      className="text-xs transition-colors focus:outline-none hover:underline"
                      style={{ color: 'var(--color-text-secondary)', fontSize: '0.65rem' }}
                    >
                      Remove
                    </button>
                  </div>
                </th>
              ))}
              {Array.from({ length: 3 - plans.length }).map((_, i) => (
                <th key={`fill-${i}`} className="py-3 px-2">
                  <div
                    className="w-full h-8 rounded-lg flex items-center justify-center"
                    style={{ border: '1.5px dashed var(--color-border)' }}
                  >
                    <span className="text-xs" style={{ color: '#cbd5e1' }}>+ add plan</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <CompareRow
              label="Monthly EMI"
              values={plans.map((p) => ({
                key: p.id,
                content: fmt(p.monthlyPayment),
                isWinner: lowestMonthly.has(p.id),
              }))}
            />
            <CompareRow
              label="Interest"
              values={plans.map((p) => ({
                key: p.id,
                content: fmtRate(p.interestRate, p.isNoCost),
                isWinner: p.isNoCost,
                highlight: p.isNoCost ? 'var(--color-success)' : '#d97706',
              }))}
            />
            <CompareRow
              label="Tenure"
              values={plans.map((p) => ({
                key: p.id,
                content: `${p.tenureMonths} months`,
              }))}
            />
            <CompareRow
              label="Total Payable"
              values={plans.map((p) => ({
                key: p.id,
                content: fmt(p.totalPayable),
              }))}
            />
            <CompareRow
              label="Cashback"
              values={plans.map((p) => ({
                key: p.id,
                content: p.cashback && parseFloat(p.cashback) > 0 ? fmt(p.cashback) : '—',
                isWinner: highestCashback.has(p.id),
                highlight: highestCashback.has(p.id) ? 'var(--color-violet)' : undefined,
              }))}
            />
            <CompareRow
              label="Effective Cost"
              values={plans.map((p) => ({
                key: p.id,
                content: fmt(effectiveCost(p)),
                isWinner: lowestEffective.has(p.id),
              }))}
            />
            {plans.some((p) => p.fundName) && (
              <CompareRow
                label="Fund"
                values={plans.map((p) => ({
                  key: p.id,
                  content: p.fundName || '—',
                  highlight: 'var(--color-text-secondary)',
                }))}
              />
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div
        className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs"
        style={{ color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}
      >
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--color-success)' }} />
          Best value
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--color-violet)' }} />
          Highest cashback
        </span>
        <span>Effective cost = total − cashback</span>
      </div>
    </div>
  )
}
