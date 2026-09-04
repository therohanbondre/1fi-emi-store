export default function Loading({ message = 'Loading…' }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-24 gap-4"
      role="status"
      aria-live="polite"
    >
      {/* Spinner */}
      <div
        className="w-10 h-10 rounded-full animate-spin"
        style={{
          border: '3px solid #e2e8f0',
          borderTopColor: 'var(--color-indigo)',
        }}
      />
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{message}</p>
    </div>
  )
}
