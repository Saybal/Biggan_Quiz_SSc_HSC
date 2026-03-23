/**
 * server/src/middleware/deviceLimit.js
 *
 * Enforces a maximum of 2 registered devices per user account.
 * Runs AFTER requireAuth.
 *
 * The client sends a device fingerprint in the X-Device-Fingerprint header.
 * We use a lightweight browser fingerprint (see client/src/hooks/useDeviceFingerprint.js).
 *
 * Logic:
 *   - If fingerprint is already registered for this user → allow + update lastSeen
 *   - If new fingerprint + user has < maxDevices → register + allow
 *   - If new fingerprint + user has >= maxDevices → 403 device limit exceeded
 */
import User from '../models/User.js'

export async function deviceLimit(req, res, next) {
  try {
    const fingerprint = req.headers['x-device-fingerprint']

    // If no fingerprint sent, allow through (graceful degradation)
    if (!fingerprint) return next()

    const userAgent = req.headers['user-agent'] || ''
    let user = await User.findOne({ firebaseUid: req.user.uid })

    // Create user doc if first time
    if (!user) {
      user = await User.create({
        firebaseUid:  req.user.uid,
        email:        req.user.email || '',
        displayName:  req.user.name  || '',
        emailVerified:req.user.email_verified || false,
        devices: [{ fingerprint, userAgent, lastSeen: new Date() }],
      })
      req.dbUser = user
      return next()
    }

    // Check if device already registered
    const existingDevice = user.devices.find(d => d.fingerprint === fingerprint)

    if (existingDevice) {
      // Update lastSeen
      existingDevice.lastSeen = new Date()
      await user.save()
      req.dbUser = user
      return next()
    }

    // New device — check limit
    if (user.devices.length >= user.maxDevices) {
      return res.status(403).json({
        error:   'device_limit_exceeded',
        message: `This account is already logged in on ${user.maxDevices} devices. Please log out from another device first.`,
        limit:   user.maxDevices,
        current: user.devices.length,
      })
    }

    // Register new device
    user.devices.push({ fingerprint, userAgent, lastSeen: new Date() })
    await user.save()
    req.dbUser = user
    next()
  } catch (err) {
    next(err)
  }
}
