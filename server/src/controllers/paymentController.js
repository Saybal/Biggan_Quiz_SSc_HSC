/**
 * server/src/controllers/paymentController.js
 *
 * Handles the complete SSLCommerz payment lifecycle:
 *   1. POST /api/payment/initiate  — create Payment doc, get gateway URL
 *   2. POST /api/payment/ipn       — SSLCommerz IPN webhook (validate + mark paid)
 *   3. GET  /api/payment/success   — redirect after successful payment
 *   4. GET  /api/payment/fail      — redirect after failed payment
 *   5. GET  /api/payment/cancel    — redirect after cancelled payment
 */
import Payment   from '../models/Payment.js'
import User      from '../models/User.js'
import Course    from '../models/Course.js'
import { initPayment, validatePayment, generateTranId } from '../services/sslcommerz.js'

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

// ── 1. Initiate payment ────────────────────────────────────────────────────────
export async function initiate(req, res, next) {
  try {
    const { courseId } = req.body
    if (!courseId) return res.status(400).json({ error: 'courseId is required' })

    const course = await Course.findById(courseId)
    if (!course) return res.status(404).json({ error: 'Course not found' })

    // Find or create MongoDB user
    const dbUser = await User.findOne({ firebaseUid: req.user.uid })
    if (!dbUser) return res.status(404).json({ error: 'User not found. Please reload the app.' })

    // Check if already purchased
    if (dbUser.hasPurchased && dbUser.purchasedCourses.some(id => id.toString() === courseId)) {
      return res.status(400).json({ error: 'You have already purchased this course.' })
    }

    const tranId = generateTranId()

    // Save pending payment record
    const payment = await Payment.create({
      userId:      dbUser._id,
      firebaseUid: req.user.uid,
      courseId:    course._id,
      tranId,
      amount:      course.price,
      currency:    'BDT',
      status:      'pending',
    })

    // Call SSLCommerz API
    const { gatewayUrl } = await initPayment({
      tranId,
      amount:        course.price,
      customerName:  dbUser.displayName || 'Student',
      customerEmail: dbUser.email,
      productName:   course.title,
      productId:     course._id.toString(),
    })

    res.json({ gatewayUrl, tranId })
  } catch (err) { next(err) }
}

// ── 2. IPN (Instant Payment Notification) ─────────────────────────────────────
// SSLCommerz POSTs here after every payment attempt
export async function ipn(req, res, next) {
  try {
    const { tran_id, val_id, status } = req.body

    if (!tran_id) return res.sendStatus(400)

    const payment = await Payment.findOne({ tranId: tran_id })
    if (!payment) return res.sendStatus(404)

    if (status === 'VALID' || status === 'VALIDATED') {
      // Always validate with SSLCommerz before marking as paid
      const validation = await validatePayment(val_id)

      if (
        validation.status === 'VALID' &&
        parseFloat(validation.amount) >= payment.amount &&
        validation.tran_id === tran_id
      ) {
        await markPaymentSuccess(payment, val_id, req.body)
      } else {
        payment.status      = 'failed'
        payment.sslResponse = req.body
        await payment.save()
      }
    } else {
      payment.status      = status === 'CANCELLED' ? 'cancelled' : 'failed'
      payment.sslResponse = req.body
      await payment.save()
    }

    res.sendStatus(200)
  } catch (err) { next(err) }
}

// ── 3. Success redirect (GET — user comes back from SSLCommerz) ───────────────
export async function success(req, res, next) {
  try {
    const { tran_id, val_id, status } = req.query

    const payment = await Payment.findOne({ tranId: tran_id })

    if (payment && (status === 'VALID' || status === 'VALIDATED')) {
      const validation = await validatePayment(val_id)
      if (
        validation.status === 'VALID' &&
        parseFloat(validation.amount) >= payment.amount
      ) {
        await markPaymentSuccess(payment, val_id, req.query)
      }
    }

    // Redirect to client success page
    res.redirect(`${CLIENT_URL}/payment/success?tran_id=${tran_id}`)
  } catch (err) {
    res.redirect(`${CLIENT_URL}/payment/fail?reason=server_error`)
  }
}

// ── 4. Fail redirect ──────────────────────────────────────────────────────────
export async function fail(req, res) {
  const { tran_id } = req.query
  if (tran_id) {
    await Payment.findOneAndUpdate({ tranId: tran_id }, { status: 'failed' }).catch(() => {})
  }
  res.redirect(`${CLIENT_URL}/payment/fail?tran_id=${tran_id || ''}`)
}

// ── 5. Cancel redirect ────────────────────────────────────────────────────────
export async function cancel(req, res) {
  const { tran_id } = req.query
  if (tran_id) {
    await Payment.findOneAndUpdate({ tranId: tran_id }, { status: 'cancelled' }).catch(() => {})
  }
  res.redirect(`${CLIENT_URL}/payment/cancel?tran_id=${tran_id || ''}`)
}

// ── GET /api/payment/status/:tranId  [requireAuth] ────────────────────────────
// Client polls this to check payment status
export async function getStatus(req, res, next) {
  try {
    const payment = await Payment.findOne({
      tranId:      req.params.tranId,
      firebaseUid: req.user.uid,
    }).lean()
    if (!payment) return res.status(404).json({ error: 'Payment not found' })
    res.json({ status: payment.status, tranId: payment.tranId })
  } catch (err) { next(err) }
}

// ── GET /api/admin/payments  [admin] ─────────────────────────────────────────
export async function getAllAdmin(req, res, next) {
  try {
    const payments = await Payment.find()
      .populate('userId', 'email displayName')
      .populate('courseId', 'title price')
      .sort({ createdAt: -1 })
      .lean()
    res.json(payments)
  } catch (err) { next(err) }
}

// ── Helper: mark payment success + grant course access ────────────────────────
async function markPaymentSuccess(payment, valId, responseData) {
  if (payment.status === 'success') return  // idempotent

  payment.status      = 'success'
  payment.valId       = valId
  payment.paidAt      = new Date()
  payment.sslResponse = responseData
  await payment.save()

  // Grant course access to user
  await User.findByIdAndUpdate(payment.userId, {
    $set:  { hasPurchased: true, purchasedAt: new Date() },
    $addToSet: { purchasedCourses: payment.courseId },
  })
}
