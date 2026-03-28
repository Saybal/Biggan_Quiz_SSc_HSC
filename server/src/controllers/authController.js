/**
 * server/src/controllers/authController.js  (Firebase version)
 *
 * Replaces the old bcrypt/jwt password-based controller.
 *
 * With Firebase Auth the server never handles passwords.
 * The client authenticates with Firebase directly and sends
 * an ID token. This controller only handles:
 *
 *  1. GET /api/auth/me        — return decoded user + role from token
 *  2. POST /api/auth/settings — update quiz settings (admin only)
 *  3. POST /api/auth/set-admin-claim — one-time: make a UID an admin
 *                                      (call this manually from server once)
 */
import admin    from 'firebase-admin'
import Settings from '../models/Settings.js'
import User from '../models/User.js'

/**
 * GET /api/auth/me  [requireAuth]
 * Returns the decoded Firebase user info + their role claim.
 * The client calls this after login to know if they are admin.
 */
export async function getMe(req, res, next) {
  try {
    // req.user is set by requireAuth middleware
    const { uid, email, name, role } = req.user
    res.json({ uid, email, name, role: role || 'user' })
  } catch (err) { next(err) }
}

/**
 * POST /api/auth/set-admin-claim
 * Body: { uid, secret }
 *
 * Sets role:'admin' custom claim on a Firebase user.
 * Protected by a one-time setup secret (ADMIN_SETUP_SECRET in .env).
 * Call this ONCE from Postman or curl after first registering your admin account.
 *
 * curl -X POST http://localhost:5000/api/auth/set-admin-claim \
 *   -H "Content-Type: application/json" \
 *   -d '{"uid":"your_firebase_uid","secret":"your_setup_secret"}'
 */
export async function setAdminClaim(req, res, next) {
  try {
    const { uid, secret } = req.body
    if (secret !== process.env.ADMIN_SETUP_SECRET) {
      return res.status(403).json({ error: 'Invalid setup secret' })
    }
    // Set the custom claim — will be present in all future ID tokens
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' })
    res.json({ message: `User ${uid} is now an admin. Ask them to log out and log in again to get the new token.` })
  } catch (err) { next(err) }
}

/**
 * GET /api/auth/settings  [requireAuth]
 * Returns quiz settings. Any logged-in user can read these
 * (they need timerMin to display the countdown on the join page).
 */
export async function getSettings(req, res, next) {
  try {
    const s = await Settings.findById('global').lean()
    res.json({
      timerMin:        s?.timerMin        ?? 30,
      shuffle:         s?.shuffle         ?? false,
      showExplanation: s?.showExplanation ?? true,
      randomQ:         s?.randomQ         ?? true,
    })
  } catch (err) { next(err) }
}

export async function getMyProfile(req, res, next) {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid })
      .select('hasPurchased emailVerified devices displayName email purchasedAt')
      .lean()
    if (!user) return res.json({ hasPurchased: false, emailVerified: false, devices: [] })
    res.json(user)
  } catch (err) { next(err) }
}
