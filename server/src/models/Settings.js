/**
 * server/src/models/Settings.js  (Firebase version)
 *
 * adminPassword field removed — Firebase handles all authentication.
 * Admin identity is determined by Firebase custom claim { role: 'admin' }.
 */
import mongoose from 'mongoose'

const SettingsSchema = new mongoose.Schema(
  {
    _id:             { type: String, default: 'global' },
    timerMin:        { type: Number, default: 30 },
    shuffle:         { type: Boolean, default: false },
    showExplanation: { type: Boolean, default: true },
    randomQ:         { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.model('Settings', SettingsSchema)
