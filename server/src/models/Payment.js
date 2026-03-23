/**
 * server/src/models/Payment.js
 *
 * Records every SSLCommerz transaction attempt.
 * Status lifecycle: pending → success | failed | cancelled
 */
import mongoose from 'mongoose'

const PaymentSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    firebaseUid:  { type: String, required: true },
    courseId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },

    // SSLCommerz fields
    tranId:       { type: String, required: true, unique: true }, // our generated transaction ID
    valId:        { type: String },                               // SSLCommerz validation ID (on success)
    amount:       { type: Number, required: true },
    currency:     { type: String, default: 'BDT' },
    status:       { type: String, enum: ['pending','success','failed','cancelled'], default: 'pending' },

    // SSLCommerz full IPN response stored for audit
    sslResponse:  { type: mongoose.Schema.Types.Mixed },

    paidAt:       { type: Date },
  },
  { timestamps: true }
)

export default mongoose.model('Payment', PaymentSchema)
