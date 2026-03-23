/**
 * server/src/routes/authRoutes.js  (Firebase version)
 *
 * Replaces the old password-based login/change-password routes.
 */
import { Router }      from 'express'
import { requireAuth } from '../middleware/firebaseAuth.js'
import { getMe, setAdminClaim, getSettings } from '../controllers/authController.js'

const router = Router()

router.get ('/me',              requireAuth, getMe)
router.get ('/settings',        requireAuth, getSettings)
router.post('/set-admin-claim', setAdminClaim)   // secret-protected, no JWT needed

export default router
