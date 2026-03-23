import Settings from '../models/Settings.js'

/** GET /api/admin/settings */
export async function get(req, res, next) {
  try {
    const s = await Settings.findById('global').lean()
    if (!s) return res.status(404).json({ error: 'Settings not found' })
    // Never expose the password hash
    const { adminPassword, ...safe } = s
    res.json(safe)
  } catch (err) { next(err) }
}

/** PATCH /api/admin/settings */
export async function update(req, res, next) {
  try {
    const { timerMin, shuffle, showExplanation, randomQ } = req.body
    const patch = {}
    if (timerMin        !== undefined) patch.timerMin        = timerMin
    if (shuffle         !== undefined) patch.shuffle         = shuffle
    if (showExplanation !== undefined) patch.showExplanation = showExplanation
    if (randomQ         !== undefined) patch.randomQ         = randomQ

    const s = await Settings.findByIdAndUpdate('global', patch, { new: true }).lean()
    const { adminPassword, ...safe } = s
    res.json(safe)
  } catch (err) { next(err) }
}
