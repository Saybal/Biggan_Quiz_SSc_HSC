/**
 * server/src/middleware/firebaseAuth.js
 *
 * Replaces the old jsonwebtoken-based auth.js entirely.
 *
 * Firebase tokens are JWTs signed by Google's servers.
 * We verify them using the official firebase-admin SDK —
 * no JWT_SECRET needed, no bcrypt, no passwords on the server at all.
 *
 * Two guards exported:
 *   requireAuth  — any logged-in Firebase user
 *   requireAdmin — only users whose Firestore/custom claim role === 'admin'
 */
import admin from 'firebase-admin'

// ── Initialise Firebase Admin SDK (once) ─────────────────────────────────────
// serviceAccountKey.json is downloaded from Firebase Console
// → Project Settings → Service accounts → Generate new private key
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    ),
  })
}

// ── Helper: extract and verify token ────────────────────────────────────────
async function verifyToken(req) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw Object.assign(new Error('No token provided'), { status: 401 })
  }
  const idToken = header.slice(7)

  // verifyIdToken contacts Google's public keys to verify signature
  // Result contains: uid, email, email_verified, and any custom claims
  const decoded = await admin.auth().verifyIdToken(idToken)
  return decoded
}

// ── requireAuth: any verified Firebase user ───────────────────────────────────
export async function requireAuth(req, res, next) {
  try {
    req.user = await verifyToken(req)
    next()
  } catch (err) {
    res.status(err.status || 401).json({ error: err.message || 'Unauthorized' })
  }
}

// ── requireAdmin: must have custom claim { role: 'admin' } ───────────────────
// Set with: admin.auth().setCustomUserClaims(uid, { role: 'admin' })
// See server/src/controllers/authController.js → seedAdminClaim()
export async function requireAdmin(req, res, next) {
  try {
    const decoded = await verifyToken(req)
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }
    req.user = decoded
    next()
  } catch (err) {
    res.status(err.status || 401).json({ error: err.message || 'Unauthorized' })
  }
}
