/**
 * ProductGallery — left column of the product detail page.
 * Logic is unchanged. Styling updated to use design system tokens.
 */
export default function ProductGallery({ product, variants, selectedVariant, onSelect }) {
  const uniqueColors   = [...new Map(variants.map((v) => [v.color,   v])).keys()]
  const uniqueStorages = [...new Map(variants.map((v) => [v.storage, v])).keys()]

  function handleColorClick(color) {
    if (selectedVariant?.color === color) return
    const s = selectedVariant?.storage
    const pick =
      variants.find((v) => v.color === color && v.storage === s && v.inStock) ??
      variants.find((v) => v.color === color && v.storage === s) ??
      variants.find((v) => v.color === color && v.inStock) ??
      variants.find((v) => v.color === color)
    if (pick) onSelect(pick)
  }

  function handleStorageClick(storage) {
    if (selectedVariant?.storage === storage) return
    const c = selectedVariant?.color
    const pick =
      variants.find((v) => v.storage === storage && v.color === c && v.inStock) ??
      variants.find((v) => v.storage === storage && v.color === c) ??
      variants.find((v) => v.storage === storage && v.inStock) ??
      variants.find((v) => v.storage === storage)
    if (pick) onSelect(pick)
  }

  const colorHasStock   = (c) => variants.some((v) => v.color   === c && v.inStock)
  const storageHasStock = (s) => variants.some((v) => v.storage === s && v.inStock)

  return (
    <div className="space-y-3">

      {/* Image card */}
      <div className="fi-card overflow-hidden">
        <div
          className="flex items-center justify-center p-6 overflow-hidden"
          style={{ background: 'var(--color-bg)', maxHeight: '16rem' }}
        >
          {selectedVariant?.imageUrl ? (
            <img
              key={selectedVariant.id}
              src={selectedVariant.imageUrl}
              alt={`${product.name} — ${selectedVariant.storage} / ${selectedVariant.color}`}
              className="max-h-full w-full object-contain transition-opacity duration-200"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.style.removeProperty('display')
              }}
            />
          ) : null}
          <span
            className="text-8xl select-none"
            style={{ color: '#e2e8f0', display: selectedVariant?.imageUrl ? 'none' : undefined }}
            aria-hidden="true"
          >
            📱
          </span>
        </div>
        {/* Full square on md+ */}
        <style>{`@media (min-width: 768px) { .gallery-image-wrap { max-height: none !important; aspect-ratio: 1; } }`}</style>
      </div>

      {/* Name + variant selectors */}
      <div className="fi-card p-4">
        <p className="font-bold text-base leading-snug break-words" style={{ color: 'var(--color-text-primary)' }}>
          {product.name}
        </p>
        {selectedVariant ? (
          <p className="text-sm mt-1 flex items-center gap-1.5 flex-wrap min-w-0" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="break-all">{selectedVariant.storage}</span>
            <span style={{ color: '#cbd5e1' }} className="shrink-0">·</span>
            <span className="break-words">{selectedVariant.color}</span>
            {!selectedVariant.inStock && (
              <span className="fi-badge shrink-0" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                Out of stock
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>No variant selected</p>
        )}

        {variants.length > 0 && (
          <div className="mt-4 space-y-4">

            {/* Colour swatches */}
            {uniqueColors.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="fi-eyebrow">Colour</p>
                  {selectedVariant?.color && (
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{selectedVariant.color}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {uniqueColors.map((color) => {
                    const isActive  = selectedVariant?.color === color
                    const hasStock  = colorHasStock(color)
                    const swatchImg = variants.find((v) => v.color === color)?.imageUrl
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => hasStock && handleColorClick(color)}
                        disabled={!hasStock}
                        title={color}
                        aria-pressed={isActive}
                        aria-label={`${color}${!hasStock ? ' — out of stock' : ''}`}
                        className="relative w-9 h-9 rounded-full overflow-hidden transition-all duration-150 focus-visible:ring-2"
                        style={{
                          border: isActive
                            ? '2px solid var(--color-indigo)'
                            : hasStock
                            ? '2px solid var(--color-border)'
                            : '2px solid #f1f5f9',
                          boxShadow: isActive ? '0 0 0 3px rgba(79,70,229,0.2)' : 'none',
                          opacity: hasStock ? 1 : 0.4,
                          cursor: hasStock ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {swatchImg ? (
                          <img src={swatchImg} alt={color} className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.style.removeProperty('display') }}
                          />
                        ) : null}
                        <span className="flex items-center justify-center h-full text-base"
                          style={{ background: 'var(--color-bg)', display: swatchImg ? 'none' : undefined }}>
                          📱
                        </span>
                        {!hasStock && (
                          <span className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
                            <span className="w-full h-px rotate-45" style={{ background: '#94a3b8', transform: 'rotate(45deg) scaleX(1.5)', display: 'block' }} />
                          </span>
                        )}
                        {isActive && (
                          <span className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true"
                            style={{ background: 'rgba(79,70,229,0.15)' }}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                              style={{ color: 'var(--color-indigo)', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Storage pills */}
            {uniqueStorages.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="fi-eyebrow">Storage</p>
                  {selectedVariant?.storage && (
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{selectedVariant.storage}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {uniqueStorages.map((storage) => {
                    const isActive = selectedVariant?.storage === storage
                    const hasStock = storageHasStock(storage)
                    return (
                      <button
                        key={storage}
                        type="button"
                        onClick={() => hasStock && handleStorageClick(storage)}
                        disabled={!hasStock}
                        aria-pressed={isActive}
                        aria-label={`${storage}${!hasStock ? ' — out of stock' : ''}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium break-all max-w-full transition-all duration-150 focus-visible:ring-2"
                        style={isActive
                          ? { border: '1px solid var(--color-indigo)', background: 'var(--color-indigo)', color: 'white' }
                          : hasStock
                          ? { border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', background: 'white', cursor: 'pointer' }
                          : { border: '1px solid #f1f5f9', color: '#cbd5e1', textDecoration: 'line-through', cursor: 'not-allowed', background: 'white' }
                        }
                      >
                        {storage}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {variants.length === 0 && (
          <p className="mt-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>No variants available.</p>
        )}
      </div>

    </div>
  )
}
