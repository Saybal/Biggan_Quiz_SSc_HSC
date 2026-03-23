import Level    from '../models/Level.js'
import Question from '../models/Question.js'

export async function getAll(req, res, next) {
  try {
    const levels = await Level.find().sort({ createdAt: 1 }).lean()
    res.json(levels)
  } catch (err) { next(err) }
}

export async function create(req, res, next) {
  try {
    const { name, short } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
    const level = await Level.create({ name: name.trim(), short: short?.trim() || '' })
    res.status(201).json(level)
  } catch (err) { next(err) }
}

export async function update(req, res, next) {
  try {
    const { name, short } = req.body
    const level = await Level.findByIdAndUpdate(
      req.params.id,
      { name, short },
      { new: true, runValidators: true }
    )
    if (!level) return res.status(404).json({ error: 'Level not found' })
    res.json(level)
  } catch (err) { next(err) }
}

export async function remove(req, res, next) {
  try {
    const level = await Level.findByIdAndDelete(req.params.id)
    if (!level) return res.status(404).json({ error: 'Level not found' })
    await Question.deleteMany({ levelId: req.params.id })
    res.json({ message: 'Level and its questions deleted' })
  } catch (err) { next(err) }
}
