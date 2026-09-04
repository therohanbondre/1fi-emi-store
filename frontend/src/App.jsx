import { Routes, Route } from 'react-router-dom'
import Home        from './pages/Home'
import ProductPage from './pages/ProductPage'
import NotFound    from './pages/NotFound'

/**
 * App — root route definitions.
 *
 * /                   → Home (product listing)
 * /products/:slug     → ProductPage (product detail + EMI plans)
 * *                   → NotFound (404)
 */
export default function App() {
  return (
    <Routes>
      <Route path="/"                element={<Home />} />
      <Route path="/products/:slug"  element={<ProductPage />} />
      <Route path="*"                element={<NotFound />} />
    </Routes>
  )
}
