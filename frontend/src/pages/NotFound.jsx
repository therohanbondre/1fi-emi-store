import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function NotFound() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar />
      <div className="flex flex-col items-center justify-center py-32 gap-5 text-center px-4">
        <p
          className="font-black select-none"
          style={{ fontSize: '5rem', lineHeight: 1, color: '#e2e8f0' }}
          aria-hidden="true"
        >
          404
        </p>
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Page not found
          </h1>
          <p className="text-sm max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Link to="/" className="fi-btn-primary mt-1">
          Back to products
        </Link>
      </div>
    </div>
  )
}
