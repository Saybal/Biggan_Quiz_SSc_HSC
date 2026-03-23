import Subject  from '../models/Subject.js'
import Question from '../models/Question.js'

export async function getAll(req, res, next) {
  try {
    const subjects = await Subject.find().sort({ createdAt: 1 }).lean()
    res.json(subjects)
  } catch (err) { next(err) }
}

export async function create(req, res, next) {
  try {
    const { name, emoji, color } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
    const subject = await Subject.create({ name: name.trim(), emoji, color })
    res.status(201).json(subject)
  } catch (err) { next(err) }
}

export async function update(req, res, next) {
  try {
    const { name, emoji, color } = req.body
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { name, emoji, color },
      { new: true, runValidators: true }
    )
    if (!subject) return res.status(404).json({ error: 'Subject not found' })
    res.json(subject)
  } catch (err) { next(err) }
}

export async function remove(req, res, next) {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id)
    if (!subject) return res.status(404).json({ error: 'Subject not found' })
    // Cascade delete questions
    await Question.deleteMany({ subjectId: req.params.id })
    res.json({ message: 'Subject and its questions deleted' })
  } catch (err) { next(err) }
}
