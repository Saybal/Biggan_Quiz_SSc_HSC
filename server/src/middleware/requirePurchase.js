/**
 * server/src/middleware/requirePurchase.js
 *
 * Middleware that runs AFTER requireAuth (or requireFirebaseAuth).
 * Blocks access to quiz questions/results unless the user has purchased.
 *
 * Usage in routes:
 *   router.get('/questions', requireAuth, requirePurchase, getAll)
 */
import User from '../models/User.js'

export async function requirePurchase(req, res, next) {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid })

    if (!user) {
      return res.status(403).json({
        error:    'purchase_required',
        message:  'Please purchase a course to access quiz content.',
      })
    }

    if (!user.hasPurchased) {
      return res.status(403).json({
        error:    'purchase_required',
        message:  'Please purchase a course to access quiz content.',
      })
    }

    // Attach user doc to request for downstream use
    req.dbUser = user
    next()
  } catch (err) {
    next(err)
  }
}
