/**
 * ProceedButton — CTA at the bottom of the EMI plans card.
 * Props unchanged: selectedPlan, onProceed
 */
export default function ProceedButton({ selectedPlan, onProceed }) {
  const hasPlan = Boolean(selectedPlan)

  return (
    <div className="mt-5 space-y-3">

      {/* Selected plan summary strip */}
      {hasPlan && (
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3 gap-3 min-w-0"
          style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}
        >
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate" style={{ color: '#3730a3' }}>
              {selectedPlan.tenureMonths}-month plan selected
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: '#4338ca' }}>
              ₹{parseFloat(selectedPlan.monthlyPayment).toLocaleString('en-IN')}/mo
              {selectedPlan.isNoCost
                ? ' · 0% interest'
                : ` · ${parseFloat(selectedPlan.interestRate).toFixed(1)}% p.a.`}
              {selectedPlan.cashback
                ? ` · ₹${parseFloat(selectedPlan.cashback).toLocaleString('en-IN')} cashback`
                : ''}
            </p>
          </div>
          <div
            className="shrink-0 flex items-center justify-center"
            style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--color-indigo)' }}
          >
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Main CTA button */}
      <button
        onClick={onProceed}
        disabled={!hasPlan}
        className="w-full py-4 rounded-xl font-bold text-sm transition-all duration-150 focus:outline-none"
        style={hasPlan
          ? {
              background: 'var(--color-indigo)',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(79,70,229,0.25)',
            }
          : {
              background: '#f1f5f9',
              color: '#94a3b8',
              cursor: 'not-allowed',
            }
        }
        onMouseEnter={(e) => { if (hasPlan) e.currentTarget.style.background = '#4338ca' }}
        onMouseLeave={(e) => { if (hasPlan) e.currentTarget.style.background = 'var(--color-indigo)' }}
        onMouseDown={(e)  => { if (hasPlan) e.currentTarget.style.transform = 'translateY(1px)' }}
        onMouseUp={(e)    => { e.currentTarget.style.transform = 'none' }}
      >
        {hasPlan ? 'Confirm Demo Financing →' : 'Select a plan to continue'}
      </button>

      {/* Trust line */}
      <p className="text-center text-xs" style={{ color: '#94a3b8' }}>
        🔒 Simulation only · No real financial transaction
      </p>

    </div>
  )
}
