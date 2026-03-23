/**
 * server/src/models/User.js
 *
 * Mirrors Firebase Auth users in MongoDB.
 * Stores device fingerprints, purchase status, email verification flag.
 * Created automatically the first time a user hits GET /api/auth/me.
 */
import mongoose from 'mongoose'

const DeviceSchema = new mongoose.Schema({
  fingerprint: { type: String, required: true },
  userAgent:   { type: String, default: '' },
  lastSeen:    { type: Date,   default: Date.now },
}, { _id: false })

const UserSchema = new mongoose.Schema(
  {
    firebaseUid:      { type: String,  required: true, unique: true, index: true },
    email:            { type: String,  required: true },
    displayName:      { type: String,  default: '' },
    emailVerified:    { type: Boolean, default: false },
    role:             { type: String,  enum: ['user', 'admin'], default: 'user' },

    // ── Purchase status ──────────────────────────────────────────────────────
    hasPurchased:     { type: Boolean, default: false },
    purchasedAt:      { type: Date },
    purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],

    // ── Device tracking (max 2 devices) ─────────────────────────────────────
    devices:          { type: [DeviceSchema], default: [] },
    maxDevices:       { type: Number, default: 2 },
  },
  { timestamps: true }
)

export default mongoose.model('User', UserSchema)
