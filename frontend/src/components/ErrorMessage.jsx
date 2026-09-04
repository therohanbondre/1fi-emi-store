export default function ErrorMessage({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 py-20 text-center px-4"
    >
      {/* Icon */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: '#fef2f2' }}
        aria-hidden="true"
      >
        ⚠️
      </div>

      <div>
        <p className="text-base font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          Something went wrong
        </p>
        <p className="text-sm max-w-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {message}
        </p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="fi-btn-primary"
        >
          Try again
        </button>
      )}
    </div>
  )
}
