import { Router }        from 'express'
import { requireAdmin }  from '../middleware/firebaseAuth.js'
import { requireAuth }   from '../middleware/firebaseAuth.js'
import * as payment      from '../controllers/paymentController.js'

const router = Router()

// ── Authenticated user routes ─────────────────────────────────────────────────
router.post('/initiate',        requireAuth,  payment.initiate)
router.get ('/status/:tranId',  requireAuth,  payment.getStatus)

// ── SSLCommerz callbacks (no auth — called by SSLCommerz servers) ─────────────
router.post('/ipn',     payment.ipn)     // IPN webhook
router.get ('/success', payment.success) // redirect after success
router.get ('/fail',    payment.fail)    // redirect after fail
router.get ('/cancel',  payment.cancel)  // redirect after cancel

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/admin/all', requireAdmin, payment.getAllAdmin)

export default router
