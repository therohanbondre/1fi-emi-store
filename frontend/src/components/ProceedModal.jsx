import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

/**
 * ProceedModal — two-screen confirmation flow.
 * Logic unchanged. Styling updated to use design system.
 */
export default function ProceedModal({ product, variant, plan, onClose }) {
  const [confirmed, setConfirmed] = useState(false)

  const monthly      = parseFloat(plan.monthlyPayment)
  const total        = parseFloat(plan.totalPayable)
  const cashback     = plan.cashback ? parseFloat(plan.cashback) : null
  const rate         = parseFloat(plan.interestRate)
  const variantLabel = `${variant.storage} / ${variant.color}`

  const [orderRef] = useState(
    () => `1FI-${Date.now().toString(36).toUpperCase().slice(-8)}`
  )

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function Row({ label, value, valueStyle = {} }) {
    return (
      <div className="flex items-start justify-between gap-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <span className="text-sm shrink-0" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
        <span className="text-sm font-semibold text-right break-words min-w-0" style={{ color: 'var(--color-text-primary)', ...valueStyle }}>
          {value}
        </span>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(11,16,32,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="rounded-2xl w-full max-w-md overflow-y-auto overflow-x-hidden"
        style={{ background: 'white', boxShadow: 'var(--shadow-modal)', maxHeight: '90vh' }}
      >

        {/* ═══════════ SCREEN 1 — Review ═══════════ */}
        {!confirmed && (
          <>
            {/* Header */}
            <div
              className="px-5 py-4 rounded-t-2xl flex items-center justify-between sticky top-0"
              style={{ background: 'var(--color-indigo)' }}
            >
              <h2 id="modal-title" className="text-white font-bold text-base flex items-center gap-2">
                <span aria-hidden="true">💳</span> Review Your Plan
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-1 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{ color: 'rgba(255,255,255,0.7)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'white' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-4">

              {/* Product summary */}
              <div className="rounded-xl p-4" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                {product.brand && (
                  <p className="fi-eyebrow mb-0.5" style={{ color: 'var(--color-indigo)', fontSize: '0.65rem' }}>{product.brand}</p>
                )}
                <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{product.name}</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{variantLabel}</p>
              </div>

              {/* Plan hero */}
              <div className="rounded-xl p-4" style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-extrabold fi-number" style={{ color: 'var(--color-indigo)' }}>
                    ₹{monthly.toLocaleString('en-IN')}
                  </span>
                  <span className="text-base font-medium" style={{ color: '#4338ca' }}>
                    × {plan.tenureMonths} months
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {plan.isNoCost
                    ? <span className="fi-badge fi-badge-emerald">0% Interest</span>
                    : <span className="fi-badge fi-badge-amber">{rate.toFixed(1)}% p.a.</span>
                  }
                  {cashback && (
                    <span className="fi-badge fi-badge-violet">Cashback ₹{cashback.toLocaleString('en-IN')}</span>
                  )}
                </div>
              </div>

              {/* Breakdown */}
              <div className="rounded-xl px-4" style={{ border: '1px solid var(--color-border)' }}>
                <Row label="Tenure"        value={`${plan.tenureMonths} months`} />
                <Row label="Monthly EMI"   value={`₹${monthly.toLocaleString('en-IN')}`} />
                <Row label="Total Payable" value={`₹${total.toLocaleString('en-IN')}`} />
                <Row
                  label="Interest"
                  value={plan.isNoCost ? '₹0 (No-cost EMI)' : `${rate.toFixed(1)}% p.a.`}
                  valueStyle={{ color: plan.isNoCost ? 'var(--color-success)' : '#d97706' }}
                />
                {cashback && (
                  <Row label="Cashback" value={`₹${cashback.toLocaleString('en-IN')}`}
                    valueStyle={{ color: 'var(--color-violet)' }} />
                )}
                {plan.fundName && (
                  <Row label="Backed by" value={`🏦 ${plan.fundName}`} />
                )}
              </div>

              <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
                EMI backed by your mutual fund investments via 1Fi.
              </p>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 space-y-2">
              <button
                onClick={() => setConfirmed(true)}
                className="fi-btn-primary w-full py-4 justify-center"
              >
                Confirm &amp; Continue
              </button>
              <button
                onClick={onClose}
                className="w-full text-sm py-2 transition-colors focus:outline-none"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                ← Go back and change plan
              </button>
            </div>
          </>
        )}

        {/* ═══════════ SCREEN 2 — Confirmed ═══════════ */}
        {confirmed && (
          <>
            {/* Header */}
            <div
              className="px-5 py-4 rounded-t-2xl flex items-center justify-between sticky top-0"
              style={{ background: 'var(--color-emerald)' }}
            >
              <h2 id="modal-title" className="text-white font-bold text-base flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-sm font-black"
                  style={{ color: 'var(--color-emerald)' }}
                >
                  ✓
                </span>
                Plan Confirmed
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-4">

              {/* Reference */}
              <div className="text-center">
                <p className="fi-eyebrow" style={{ color: 'var(--color-text-secondary)' }}>Reference</p>
                <p className="text-xl font-bold font-mono mt-1" style={{ color: 'var(--color-text-primary)' }}>
                  {orderRef}
                </p>
              </div>

              {/* Selected Plan card */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                <div className="px-4 py-2.5 text-center" style={{ background: 'var(--color-indigo)' }}>
                  <p className="text-white text-sm font-bold tracking-wide">Selected Plan</p>
                </div>
                <div className="p-4 divide-y" style={{ '--tw-divide-color': 'var(--color-border)' }}>
                  <div className="flex justify-between py-2.5">
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Tenure</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{plan.tenureMonths} months</span>
                  </div>
                  <div className="py-3 text-center" style={{ background: 'var(--color-bg)', borderRadius: '0.75rem', margin: '0.5rem 0' }}>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Monthly Payment</p>
                    <p className="text-3xl font-extrabold fi-number" style={{ color: 'var(--color-text-primary)' }}>
                      ₹{monthly.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>per month</p>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Interest</span>
                    <span className="text-sm font-bold" style={{ color: plan.isNoCost ? 'var(--color-success)' : '#d97706' }}>
                      {plan.isNoCost ? '0% interest' : `${rate.toFixed(1)}% p.a.`}
                    </span>
                  </div>
                  {cashback && (
                    <div className="flex justify-between py-2.5">
                      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cashback</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--color-violet)' }}>₹{cashback.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2.5">
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Payable</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                  {plan.fundName && (
                    <div className="flex justify-between items-start gap-4 py-2.5">
                      <span className="text-sm shrink-0" style={{ color: 'var(--color-text-secondary)' }}>Backed by</span>
                      <span className="text-xs font-medium text-right break-words min-w-0" style={{ color: 'var(--color-text-primary)' }}>
                        🏦 {plan.fundName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Product recap */}
              <div className="rounded-xl px-4 py-3" style={{ background: 'var(--color-mint-soft)', border: '1px solid #a7f3d0' }}>
                {product.brand && (
                  <p className="fi-eyebrow" style={{ color: '#065f46', fontSize: '0.65rem' }}>{product.brand}</p>
                )}
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{product.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{variantLabel}</p>
              </div>

              {/* Demo disclaimer */}
              <div className="rounded-xl px-4 py-3 text-center" style={{ background: '#fffbeb', border: '1px solid #fcd34d' }}>
                <p className="text-xs font-medium" style={{ color: '#92400e' }}>
                  ⓘ Demo only — no payment has been sent or processed.
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="px-5 pb-5 space-y-2">
              <Link
                to="/"
                onClick={onClose}
                className="fi-btn-success w-full justify-center"
              >
                Back to Products
              </Link>
              <button
                onClick={onClose}
                className="w-full text-sm py-2 transition-colors focus:outline-none"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Stay on this page
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
