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
import User from '../models/User.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

if (!admin.apps.length) {
  // Read the file relative to this middleware file's location
  const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '../../serviceAccountKey.json'), 'utf8')
  )

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
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
    const decoded = await verifyToken(req)
    req.user = decoded

    // Keep a MongoDB mirror of Firebase users for features like email reminders.
    // This is best-effort and must not block requests.
    // try {
    //   const role = decoded.role || 'user'
    //   await User.findOneAndUpdate(
    //     { firebaseUid: decoded.uid },
    //     {
    //       firebaseUid: decoded.uid,
    //       email: decoded.email,
    //       displayName: decoded.name || '',
    //       emailVerified: decoded.email_verified || false,
    //       role,
    //     },
    //     { upsert: true, new: true, setDefaultsOnInsert: true }
    //   )
    // } catch {
    //   // ignore mongo errors for auth flow
    // }
    // Replace the try block inside requireAuth (the "Keep a MongoDB mirror" section):
// try {
//   const fingerprint = req.headers['x-device-fingerprint']
//   const userAgent   = req.headers['user-agent'] || ''
//   const role = decoded.role || 'user'

//   const updateOp = {
//     $set: {
//       firebaseUid:   decoded.uid,
//       email:         decoded.email,
//       displayName:   decoded.name || '',
//       emailVerified: decoded.email_verified || false,
//       role,
//     },
//   }

//   // Register device if fingerprint provided and not already tracked
//   if (fingerprint) {
//     updateOp.$addToSet = {
//       devices: { fingerprint, userAgent, lastSeen: new Date() }
//     }
//   }

//   const dbUser = await User.findOneAndUpdate(
//     { firebaseUid: decoded.uid },
//     updateOp,
//     { upsert: true, new: true, setDefaultsOnInsert: true }
//   )

//   // Update lastSeen for existing device (addToSet won't update it)
//   if (fingerprint && dbUser) {
//     await User.updateOne(
//       { firebaseUid: decoded.uid, 'devices.fingerprint': fingerprint },
//       { $set: { 'devices.$.lastSeen': new Date() } }
//     )
//   }

//   req.dbUser = dbUser
    // }
    try {
      // REPLACE the entire device block with:
const fingerprint = req.headers['x-device-fingerprint']
const userAgent   = req.headers['user-agent'] || ''
const role = decoded.role || 'user'

let dbUser = await User.findOneAndUpdate(
  { firebaseUid: decoded.uid },
  {
    $set: {
      firebaseUid:   decoded.uid,
      email:         decoded.email,
      displayName:   decoded.name || '',
      emailVerified: decoded.email_verified || false,
      role,
    },
  },
  { upsert: true, new: true, setDefaultsOnInsert: true }
)

if (fingerprint && dbUser) {
  const already = dbUser.devices.some(d => d.fingerprint === fingerprint)
  if (!already) {
    if (dbUser.devices.length < dbUser.maxDevices) {
      await User.updateOne(
        { firebaseUid: decoded.uid },
        { $push: { devices: { fingerprint, userAgent, lastSeen: new Date() } } }
      )
    }
    // If at limit, don't block here — deviceLimit middleware handles blocking
  } else {
    // Update lastSeen only
    await User.updateOne(
      { firebaseUid: decoded.uid, 'devices.fingerprint': fingerprint },
      { $set: { 'devices.$.lastSeen': new Date() } }
    )
  }
}

req.dbUser = dbUser
    }
catch {
  // ignore mongo errors for auth flow
}
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

    // Same best-effort upsert for admin users.
    try {
      await User.findOneAndUpdate(
        { firebaseUid: decoded.uid },
        {
          firebaseUid: decoded.uid,
          email: decoded.email,
          displayName: decoded.name || '',
          emailVerified: decoded.email_verified || false,
          role: 'admin',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    } catch {
      // ignore
    }

    next()
  } catch (err) {
    res.status(err.status || 401).json({ error: err.message || 'Unauthorized' })
  }
}
