import User from '../models/User.js'

// GET /api/admin/students?email=&hasPurchased=
export async function listStudents(req, res, next) {
  try {
    const filter = { role: 'user' }
    if (req.query.email) {
      filter.email = { $regex: req.query.email.trim(), $options: 'i' }
    }
    if (req.query.hasPurchased !== undefined && req.query.hasPurchased !== '') {
      filter.hasPurchased = req.query.hasPurchased === 'true'
    }

    const students = await User.find(filter)
      .select('firebaseUid email displayName emailVerified hasPurchased purchasedAt devices createdAt')
      .sort({ createdAt: -1 })
      .lean()

    res.json(students)
  } catch (err) { next(err) }
}

// PATCH /api/admin/students/:firebaseUid/purchase
export async function updatePurchase(req, res, next) {
  try {
    const { hasPurchased } = req.body
    if (typeof hasPurchased !== 'boolean')
      return res.status(400).json({ error: 'hasPurchased must be boolean' })

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.params.firebaseUid },
      {
        $set: {
          hasPurchased,
          ...(hasPurchased ? { purchasedAt: new Date() } : { purchasedAt: null }),
        },
      },
      { new: true }
    ).select('email displayName hasPurchased purchasedAt')

    if (!user) return res.status(404).json({ error: 'Student not found' })
    res.json(user)
  } catch (err) { next(err) }
}