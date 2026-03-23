/**
 * server/src/models/Course.js
 *
 * A purchasable course that unlocks quiz access.
 * Admin creates courses; users buy them via SSLCommerz.
 */
import mongoose from 'mongoose'

const CourseSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    price:       { type: Number, required: true },        // BDT
    currency:    { type: String, default: 'BDT' },
    thumbnail:   { type: String, default: '' },           // image URL
    features:    { type: [String], default: [] },         // bullet points shown on course card
    subjectIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }], // which subjects unlocked
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.model('Course', CourseSchema)
