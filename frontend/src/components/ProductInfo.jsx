// Demo value — not a real financial figure
const DEMO_FINANCING = 185000

/**
 * ProductInfo — price block, eligibility card, description.
 * Props unchanged: product, selectedVariant
 */
export default function ProductInfo({ product, selectedVariant }) {
  const mrp      = parseFloat(product.mrp)
  const price    = parseFloat(product.price)
  const discount = mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0
  const savings  = mrp - price
  const withinLimit = price <= DEMO_FINANCING
  const remaining   = DEMO_FINANCING - price

  return (
    <div className="space-y-4">

      {/* Brand + category eyebrow */}
      <div className="flex items-center gap-2 flex-wrap">
        {product.brand && (
          <span className="fi-eyebrow" style={{ color: 'var(--color-indigo)', fontSize: '0.7rem' }}>
            {product.brand}
          </span>
        )}
        {product.brand && product.category && (
          <span style={{ color: '#cbd5e1' }}>·</span>
        )}
        {product.category && (
          <span className="fi-eyebrow" style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
            {product.category}
          </span>
        )}
      </div>

      {/* Product name */}
      <h1
        className="text-xl sm:text-2xl font-bold leading-snug break-words"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {product.name}
      </h1>

      {/* Selected variant badges */}
      {selectedVariant && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="fi-badge fi-badge-gray">{selectedVariant.storage}</span>
          <span className="fi-badge fi-badge-gray">{selectedVariant.color}</span>
          {!selectedVariant.inStock && (
            <span className="fi-badge" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
              Out of stock
            </span>
          )}
        </div>
      )}

      <div className="fi-divider" />

      {/* Price block */}
      <div className="space-y-1.5">
        <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
          <span
            className="text-3xl sm:text-4xl font-extrabold tracking-tight fi-number"
            style={{ color: 'var(--color-text-primary)' }}
          >
            ₹{price.toLocaleString('en-IN')}
          </span>
          {discount > 0 && (
            <span
              className="text-lg line-through font-normal fi-number"
              style={{ color: '#94a3b8' }}
            >
              ₹{mrp.toLocaleString('en-IN')}
            </span>
          )}
          {discount > 0 && (
            <span className="fi-badge fi-badge-emerald">{discount}% off</span>
          )}
        </div>

        {savings > 0 && (
          <p className="text-sm font-semibold fi-number" style={{ color: 'var(--color-success)' }}>
            You save ₹{savings.toLocaleString('en-IN')}
          </p>
        )}
        <p className="text-xs" style={{ color: '#94a3b8' }}>Inclusive of all taxes · Free delivery</p>
      </div>

      {/* Stock indicator */}
      {selectedVariant && (
        <div className="flex items-center gap-2 text-sm font-medium">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: selectedVariant.inStock ? 'var(--color-success)' : 'var(--color-error)' }}
          />
          <span style={{ color: selectedVariant.inStock ? 'var(--color-success)' : 'var(--color-error)' }}>
            {selectedVariant.inStock ? 'In stock · Ready to ship' : 'Out of stock'}
          </span>
        </div>
      )}

      {/* Investment eligibility card */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={withinLimit
          ? { background: 'var(--color-mint-soft)', border: '1px solid #a7f3d0' }
          : { background: '#fffbeb', border: '1px solid #fcd34d' }
        }
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          {withinLimit ? (
            <>
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#065f46' }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-bold" style={{ color: '#065f46' }}>
                Within your investment power
              </span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#92400e' }}>
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-bold" style={{ color: '#92400e' }}>
                Above simulated financing limit
              </span>
            </>
          )}
        </div>

        {/* Rows */}
        <div className="space-y-1.5">
          {[
            { label: 'Product price',      value: `₹${price.toLocaleString('en-IN')}` },
            { label: 'Your financing',     value: `₹${DEMO_FINANCING.toLocaleString('en-IN')}` },
            withinLimit
              ? { label: 'Remaining capacity', value: `₹${remaining.toLocaleString('en-IN')}`, highlight: true }
              : { label: 'Shortfall',          value: `₹${Math.abs(remaining).toLocaleString('en-IN')}`, highlight: true },
          ].map((row) => (
            <div key={row.label} className="flex justify-between text-xs gap-4">
              <span style={{ color: withinLimit ? '#065f46' : '#92400e', opacity: 0.8 }}>{row.label}</span>
              <span
                className="font-semibold fi-number"
                style={{ color: withinLimit ? '#065f46' : '#92400e' }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs" style={{ color: withinLimit ? '#065f46' : '#92400e', opacity: 0.7 }}>
          {withinLimit
            ? 'You can explore this purchase with simulated investment-backed financing.'
            : 'Consider a higher-capacity plan or explore alternative products.'}
        </p>

        {/* DEMO label */}
        <p className="text-xs font-semibold" style={{ color: '#94a3b8' }}>
          ⓘ Simulation only — no real financial transaction
        </p>
      </div>

      {/* Description */}
      {product.description && (
        <p
          className="text-sm leading-relaxed break-words pt-1"
          style={{ color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}
        >
          {product.description}
        </p>
      )}

    </div>
  )
}
