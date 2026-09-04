// Product routes
// All business logic lives in the controller and service layers.

import { Router } from 'express'
import {
  listProducts,
  getProduct,
  listVariants,
  listEmiPlans,
} from '../controllers/productController.js'

const router = Router()

// GET /api/products
router.get('/', listProducts)

// GET /api/products/:slug
router.get('/:slug', getProduct)

// GET /api/products/:slug/variants
router.get('/:slug/variants', listVariants)

// GET /api/products/:slug/emi-plans
router.get('/:slug/emi-plans', listEmiPlans)

export default router
