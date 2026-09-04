import { useState, useMemo } from 'react'

// =============================================================================
// emiLib.js (inline) — pure calculation logic, no React imports
//
// Kept in the same file for now; easy to extract to src/utils/emiLib.js
// if unit tests are added later.
// =============================================================================

/**
 * Calculate monthly EMI using the standard reducing-balance formula.
 *
 *       P × r × (1 + r)^n
 *   M = ──────────────────      r = annualRatePct / 12 / 100
 *         (1 + r)^n − 1         n = tenureMonths
 *
 * For 0% interest:  M = P / n  (exact — no ceiling to avoid overpaying)
 *
 * Returns null if any input is invalid (caller should show an error).
 */
export function calcEmi(principal, annualRatePct, tenureMonths) {
  // Guard: all inputs must be finite, positive (principal & tenure), non-negative (rate)
  if (
    !Number.isFinite(principal)    || principal    <= 0 ||
    !Number.isFinite(annualRatePct)|| annualRatePct < 0  ||
    !Number.isFinite(tenureMonths) || tenureMonths  <= 0
  ) return null

  if (annualRatePct === 0) {
    // 0% no-cost EMI — divide exactly, then ceiling so total ≥ principal
    return Math.ceil(principal / tenureMonths)
  }

  const r      = annualRatePct / 12 / 100
  const factor = Math.pow(1 + r, tenureMonths)

  // Guard against floating-point edge cases (factor − 1 ≈ 0 for tiny rates)
  const denominator = factor - 1
  if (!Number.isFinite(denominator) || denominator === 0) return null

  const emi = (principal * r * factor) / denominator
  if (!Number.isFinite(emi) || emi <= 0) return null

  return Math.ceil(emi)   // whole rupees, ceiling so total ≥ principal
}

/**
 * Validate all calculator inputs.
 * Returns an object of field → error message string (empty string = no error).
 */
export function validateInputs({ price, downPayment, rate, tenure }) {
  const errors = { price: '', downPayment: '', rate: '', tenure: '' }

  // Price
  if (!price || price === '') {
    errors.price = 'Product price is required.'
  } else if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
    errors.price = 'Price must be greater than 0.'
  }

  // Down Payment
  const priceNum = Number(price)
  const dpNum    = Number(downPayment)
  if (downPayment !== '' && !Number.isFinite(dpNum)) {
    errors.downPayment = 'Down payment must be a valid number.'
  } else if (downPayment !== '' && dpNum < 0) {
    errors.downPayment = 'Down payment cannot be negative.'
  } else if (downPayment !== '' && Number.isFinite(priceNum) && priceNum > 0 && dpNum >= priceNum) {
    errors.downPayment = 'Down payment cannot equal or exceed the product price.'
  }

  // Interest Rate
  const rateNum = Number(rate)
  if (rate === '' || rate === null || rate === undefined) {
    errors.rate = 'Interest rate is required.'
  } else if (!Number.isFinite(rateNum)) {
    errors.rate = 'Interest rate must be a valid number.'
  } else if (rateNum < 0) {
    errors.rate = 'Interest rate cannot be negative.'
  } else if (rateNum > 100) {
    errors.rate = 'Interest rate cannot exceed 100%.'
  }

  // Tenure
  const tenureNum = Number(tenure)
  if (!tenure || tenure === '') {
    errors.tenure = 'Tenure is required.'
  } else if (!Number.isFinite(tenureNum) || tenureNum <= 0) {
    errors.tenure = 'Tenure must be greater than 0.'
  } else if (!Number.isInteger(tenureNum)) {
    errors.tenure = 'Tenure must be a whole number of months.'
  }

  return errors
}

// =============================================================================
// UI constants
// =============================================================================

const TENURE_OPTIONS = [3, 6, 9, 12, 18, 24]

const RATE_PRESETS = [
  { label: '0%',    value: 0    },
  { label: '10.5%', value: 10.5 },
  { label: '12%',   value: 12   },
  { label: '13.5%', value: 13.5 },
  { label: '14%',   value: 14   },
]

// =============================================================================
// Small UI helpers
// =============================================================================

/** Format a number as an Indian-locale currency string (no decimals) */
function fmt(n) {
  if (!Number.isFinite(n)) return '—'
  return Math.round(n).toLocaleString('en-IN')
}

/** Single row in the results breakdown table */
function ResultRow({ label, value, highlight = false, valueColor = '' }) {
  return (
    <div
      className="flex items-center justify-between gap-4 py-2.5 last:border-0"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      <span
        className="text-sm"
        style={{ color: highlight ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: highlight ? 600 : 400 }}
      >
        {label}
      </span>
      <span
        className="text-sm font-semibold fi-number text-right"
        style={{ color: valueColor || (highlight ? 'var(--color-text-primary)' : 'var(--color-text-secondary)') }}
      >
        {value}
      </span>
    </div>
  )
}

/** Red error message beneath an input */
function FieldError({ message }) {
  if (!message) return null
  return (
    <p className="mt-1 text-xs font-medium" role="alert" style={{ color: 'var(--color-error)' }}>
      {message}
    </p>
  )
}

// =============================================================================
// EmiCalculator — main component
//
// Props:
//   productPrice — number  (from product.price via ProductPage; may be 0 on load)
// =============================================================================

export default function EmiCalculator({ productPrice }) {
  // ── Raw string state (lets users type freely without coercion) ──────────────
  const [price,       setPrice]       = useState(() =>
    productPrice > 0 ? String(Math.round(productPrice)) : ''
  )
  const [downPayment, setDownPayment] = useState('')
  const [rateInput,   setRateInput]   = useState('10.5')
  const [activePreset,setActivePreset]= useState(10.5)
  const [tenure,      setTenure]      = useState(12)
  // Track whether the user has interacted with a field (show errors only after touch)
  const [touched, setTouched] = useState({ price: false, downPayment: false, rate: false })

  // ── Derived numbers ─────────────────────────────────────────────────────────
  const priceNum    = parseFloat(price)       || 0
  const dpNum       = parseFloat(downPayment) || 0
  const rateNum     = parseFloat(rateInput)
  const loanPrincipal = Math.max(0, priceNum - dpNum)

  // ── Validation ──────────────────────────────────────────────────────────────
  const errors = useMemo(() => validateInputs({
    price,
    downPayment,
    rate:   rateInput,
    tenure,
  }), [price, downPayment, rateInput, tenure])

  const hasErrors = Object.values(errors).some(Boolean)

  // ── Calculations (only when all inputs are valid) ───────────────────────────
  const monthly = useMemo(() => {
    if (hasErrors || loanPrincipal <= 0) return null
    return calcEmi(loanPrincipal, Number.isFinite(rateNum) ? rateNum : 0, tenure)
  }, [hasErrors, loanPrincipal, rateNum, tenure])

  const totalPayable  = monthly !== null ? monthly * tenure               : null
  const totalInterest = totalPayable    !== null ? Math.max(0, totalPayable - loanPrincipal) : null
  const isNoCost      = Number.isFinite(rateNum) && rateNum === 0

  // Fraction of total that is interest — for the visual breakdown bar
  const interestFraction = totalPayable && totalPayable > 0
    ? (totalInterest / totalPayable)
    : 0

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handlePriceChange(e) {
    const raw = e.target.value.replace(/[^\d]/g, '')
    setPrice(raw)
    setTouched((t) => ({ ...t, price: true }))
  }

  function handleDownPaymentChange(e) {
    const raw = e.target.value.replace(/[^\d]/g, '')
    setDownPayment(raw)
    setTouched((t) => ({ ...t, downPayment: true }))
  }

  function handleRatePreset(value) {
    setActivePreset(value)
    setRateInput(String(value))
    setTouched((t) => ({ ...t, rate: true }))
  }

  function handleRateInput(e) {
    setRateInput(e.target.value)
    setActivePreset(null)
    setTouched((t) => ({ ...t, rate: true }))
  }

  function handleReset() {
    setPrice(productPrice > 0 ? String(Math.round(productPrice)) : '')
    setDownPayment('')
    setRateInput('10.5')
    setActivePreset(10.5)
    setTenure(12)
    setTouched({ price: false, downPayment: false, rate: false })
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* Header */}
      <div className="mb-5">
        <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <span className="text-base" aria-hidden="true">🧮</span>
          EMI Calculator
        </h2>
        <p className="text-xs mt-0.5 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
          Estimate your monthly payment with down payment and custom interest rate
        </p>
      </div>

      {/* ── INPUTS ── */}
      <div className="space-y-4">

        {/* Product Price */}
        <div>
          <label htmlFor="calc-price" className="fi-eyebrow block mb-1.5">
            Product Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold select-none" style={{ color: 'var(--color-text-secondary)' }}>₹</span>
            <input
              id="calc-price"
              type="text"
              inputMode="numeric"
              value={price ? Number(price).toLocaleString('en-IN') : ''}
              onChange={handlePriceChange}
              onBlur={() => setTouched((t) => ({ ...t, price: true }))}
              placeholder="Enter price"
              aria-describedby={touched.price && errors.price ? 'price-error' : undefined}
              className="w-full pl-7 pr-4 py-2.5 text-sm font-semibold rounded-xl transition-colors focus:outline-none"
              style={{
                background: 'var(--color-bg)',
                border: touched.price && errors.price ? `2px solid var(--color-error)` : `1px solid var(--color-border)`,
                color: 'var(--color-text-primary)',
              }}
              onFocus={(e) => {
                if (!(touched.price && errors.price)) {
                  e.target.style.borderColor = 'var(--color-indigo)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'
                }
              }}
              onBlurCapture={(e) => {
                if (!(touched.price && errors.price)) {
                  e.target.style.borderColor = 'var(--color-border)'
                  e.target.style.boxShadow = 'none'
                }
              }}
            />
          </div>
          {touched.price && errors.price && (
            <p id="price-error" className="mt-1 text-xs font-medium" role="alert" style={{ color: 'var(--color-error)' }}>
              {errors.price}
            </p>
          )}
          {productPrice > 0 && String(Math.round(productPrice)) !== price && (
            <button
              type="button"
              onClick={() => { setPrice(String(Math.round(productPrice))); setTouched((t) => ({ ...t, price: true })) }}
              className="mt-1.5 text-xs hover:underline transition-colors"
              style={{ color: 'var(--color-indigo)' }}
            >
              Use product price ₹{Math.round(productPrice).toLocaleString('en-IN')}
            </button>
          )}
        </div>

        {/* Down Payment */}
        <div>
          <label htmlFor="calc-dp" className="fi-eyebrow block mb-1.5">
            Down Payment{' '}
            <span className="normal-case font-normal" style={{ color: 'var(--color-text-secondary)' }}>(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold select-none" style={{ color: 'var(--color-text-secondary)' }}>₹</span>
            <input
              id="calc-dp"
              type="text"
              inputMode="numeric"
              value={downPayment ? Number(downPayment).toLocaleString('en-IN') : ''}
              onChange={handleDownPaymentChange}
              onBlur={() => setTouched((t) => ({ ...t, downPayment: true }))}
              placeholder="0"
              aria-describedby={touched.downPayment && errors.downPayment ? 'dp-error' : undefined}
              className="w-full pl-7 pr-4 py-2.5 text-sm font-semibold rounded-xl transition-colors focus:outline-none"
              style={{
                background: 'var(--color-bg)',
                border: touched.downPayment && errors.downPayment ? `2px solid var(--color-error)` : `1px solid var(--color-border)`,
                color: 'var(--color-text-primary)',
              }}
              onFocus={(e) => {
                if (!(touched.downPayment && errors.downPayment)) {
                  e.target.style.borderColor = 'var(--color-indigo)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'
                }
              }}
            />
          </div>
          {touched.downPayment && errors.downPayment && (
            <p id="dp-error" className="mt-1 text-xs font-medium" role="alert" style={{ color: 'var(--color-error)' }}>
              {errors.downPayment}
            </p>
          )}
          {priceNum > 0 && dpNum > 0 && !errors.price && !errors.downPayment && (
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Loan principal:{' '}
              <span className="font-semibold fi-number" style={{ color: 'var(--color-text-primary)' }}>
                ₹{fmt(loanPrincipal)}
              </span>
            </p>
          )}
        </div>

        {/* Interest Rate */}
        <div>
          <label className="fi-eyebrow block mb-1.5">Interest Rate (% p.a.)</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {RATE_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => handleRatePreset(p.value)}
                aria-pressed={activePreset === p.value}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 focus-visible:ring-2"
                style={activePreset === p.value
                  ? { border: `1px solid var(--color-indigo)`, background: 'var(--color-indigo)', color: 'white' }
                  : { border: `1px solid var(--color-border)`, color: 'var(--color-text-secondary)', background: 'white' }
                }
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={rateInput}
              onChange={handleRateInput}
              onBlur={() => setTouched((t) => ({ ...t, rate: true }))}
              placeholder="Custom %"
              aria-label="Annual interest rate percentage"
              aria-describedby={touched.rate && errors.rate ? 'rate-error' : undefined}
              className="w-full pr-10 pl-3 py-2.5 text-sm font-semibold rounded-xl transition-colors focus:outline-none"
              style={{
                background: 'var(--color-bg)',
                border: touched.rate && errors.rate ? `2px solid var(--color-error)` : `1px solid var(--color-border)`,
                color: 'var(--color-text-primary)',
              }}
              onFocus={(e) => {
                if (!(touched.rate && errors.rate)) {
                  e.target.style.borderColor = 'var(--color-indigo)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'
                }
              }}
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm select-none"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              %
            </span>
          </div>
          {touched.rate && errors.rate && (
            <p id="rate-error" className="mt-1 text-xs font-medium" role="alert" style={{ color: 'var(--color-error)' }}>
              {errors.rate}
            </p>
          )}
        </div>

        {/* Tenure pills */}
        <div>
          <label className="fi-eyebrow block mb-1.5">Tenure</label>
          <div className="flex flex-wrap gap-2">
            {TENURE_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTenure(t)}
                aria-pressed={tenure === t}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 focus-visible:ring-2"
                style={tenure === t
                  ? { border: `1px solid var(--color-indigo)`, background: 'var(--color-indigo)', color: 'white' }
                  : { border: `1px solid var(--color-border)`, color: 'var(--color-text-secondary)', background: 'white' }
                }
              >
                {t} mo
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ── RESULTS ── */}
      {monthly !== null && !hasErrors && (
        <div className="mt-6">

          <div className="fi-divider" />

          {/* Hero monthly EMI */}
          <div className="text-center mb-5">
            <p className="fi-eyebrow mb-1" style={{ letterSpacing: '0.1em' }}>Monthly EMI</p>
            <p className="text-4xl font-extrabold fi-number" style={{ color: 'var(--color-text-primary)' }}>
              ₹{fmt(monthly)}
            </p>
            <p className="text-xs mt-1 flex items-center justify-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
              <span>× {tenure} months</span>
              {isNoCost && (
                <span className="fi-badge fi-badge-emerald">0% Interest</span>
              )}
            </p>
          </div>

          {/* Principal vs Interest breakdown bar */}
          {totalPayable > 0 && (
            <div className="mb-5">
              <div
                className="flex rounded-full overflow-hidden h-2"
                style={{ background: 'var(--color-border)' }}
              >
                <div
                  className="transition-all duration-300"
                  style={{
                    width: `${Math.max(0, (1 - interestFraction) * 100).toFixed(1)}%`,
                    background: 'var(--color-indigo)',
                  }}
                  title={`Principal: ₹${fmt(loanPrincipal)}`}
                />
                {totalInterest > 0 && (
                  <div
                    className="transition-all duration-300"
                    style={{
                      width: `${(interestFraction * 100).toFixed(1)}%`,
                      background: 'var(--color-warning)',
                    }}
                    title={`Interest: ₹${fmt(totalInterest)}`}
                  />
                )}
              </div>
              <div className="flex justify-between mt-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--color-indigo)' }} />
                  Principal
                </span>
                <span className="flex items-center gap-1">
                  Interest
                  <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--color-warning)' }} />
                </span>
              </div>
            </div>
          )}

          {/* Breakdown table */}
          <div className="rounded-xl px-4" style={{ border: `1px solid var(--color-border)` }}>
            <ResultRow label="Product Price"       value={`₹${fmt(priceNum)}`} />
            {dpNum > 0 && (
              <ResultRow
                label="Down Payment"
                value={`− ₹${fmt(dpNum)}`}
                valueColor="var(--color-text-secondary)"
              />
            )}
            <ResultRow label="Loan Principal"       value={`₹${fmt(loanPrincipal)}`} />
            <ResultRow label="Monthly EMI"          value={`₹${fmt(monthly)}`} highlight />
            <ResultRow
              label="Total Interest"
              value={isNoCost ? '₹0' : `₹${fmt(totalInterest)}`}
              valueColor={isNoCost ? 'var(--color-success)' : 'var(--color-warning)'}
            />
            <ResultRow label="Total Amount Payable" value={`₹${fmt(totalPayable)}`} highlight />
          </div>

          {/* Contextual note */}
          {isNoCost && (
            <p className="mt-3 text-xs font-medium text-center" style={{ color: 'var(--color-success)' }}>
              No-cost EMI — you pay zero extra interest
            </p>
          )}
          {!isNoCost && totalInterest > 0 && (
            <p className="mt-3 text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
              Total interest of ₹{fmt(totalInterest)} over {tenure} months
              ({((totalInterest / loanPrincipal) * 100).toFixed(1)}% of loan)
            </p>
          )}

        </div>
      )}

      {/* Empty / invalid state */}
      {(monthly === null || hasErrors) && (
        <div
          className="mt-6 pt-5 text-center text-sm"
          style={{ borderTop: `1px solid var(--color-border)`, color: 'var(--color-text-secondary)' }}
        >
          {hasErrors
            ? 'Fix the errors above to see your EMI estimate'
            : 'Enter a valid loan amount to see your EMI'}
        </div>
      )}

      {/* Reset */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={handleReset}
          className="text-xs transition-colors focus:outline-none focus-visible:underline"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Reset to defaults
        </button>
      </div>

    </div>
  )
}

