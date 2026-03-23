import Question from '../models/Question.js'

/** GET /api/questions?subjectId=&levelId= */
export async function getAll(req, res, next) {
  try {
    const filter = {}
    if (req.query.subjectId) filter.subjectId = req.query.subjectId
    if (req.query.levelId)   filter.levelId   = req.query.levelId

    const questions = await Question.find(filter)
      .sort({ createdAt: 1 })
      .lean()
    res.json(questions)
  } catch (err) { next(err) }
}

/** POST /api/admin/questions */
export async function create(req, res, next) {
  try {
    const { subjectId, levelId, q, opts, ans, marks, context, explanation, image, tags, wordLinks } = req.body
    if (!subjectId || !levelId || !q || !opts || ans === undefined)
      return res.status(400).json({ error: 'subjectId, levelId, q, opts, ans are required' })
    if (!Array.isArray(opts) || opts.length < 2)
      return res.status(400).json({ error: 'opts must be an array with at least 2 items' })

    const question = await Question.create({
      subjectId, levelId, q, opts, ans,
      marks:       marks       || 1,
      context:     context     || '',
      explanation: explanation || '',
      image:       image       || '',
      tags:        tags        || [],
      wordLinks:   wordLinks   || [],
    })
    res.status(201).json(question)
  } catch (err) { next(err) }
}

/** PUT /api/admin/questions/:id */
export async function update(req, res, next) {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!question) return res.status(404).json({ error: 'Question not found' })
    res.json(question)
  } catch (err) { next(err) }
}

/** DELETE /api/admin/questions/:id */
export async function remove(req, res, next) {
  try {
    const question = await Question.findByIdAndDelete(req.params.id)
    if (!question) return res.status(404).json({ error: 'Question not found' })
    res.json({ message: 'Question deleted' })
  } catch (err) { next(err) }
}

/** POST /api/admin/questions/bulk — bulk import JSON array */
export async function bulkCreate(req, res, next) {
  try {
    const { subjectId, levelId, questions } = req.body
    if (!subjectId || !levelId || !Array.isArray(questions))
      return res.status(400).json({ error: 'subjectId, levelId, questions[] required' })

    const valid = questions
      .filter(item => item.q && Array.isArray(item.opts) && item.opts.length >= 2 && item.ans !== undefined)
      .map(item => ({
        subjectId,
        levelId,
        q:           String(item.q),
        opts:        item.opts.map(String),
        ans:         parseInt(item.ans),
        marks:       parseInt(item.marks) || 1,
        context:     item.context     || '',
        explanation: item.explanation || '',
        image:       item.image       || '',
        tags:        Array.isArray(item.tags) ? item.tags.map(String) : [],
      }))

    const inserted = await Question.insertMany(valid)
    res.status(201).json({ inserted: inserted.length, skipped: questions.length - valid.length })
  } catch (err) { next(err) }
}

/** GET /api/admin/questions/export?subjectId=&levelId= */
export async function exportQuestions(req, res, next) {
  try {
    const filter = {}
    if (req.query.subjectId) filter.subjectId = req.query.subjectId
    if (req.query.levelId)   filter.levelId   = req.query.levelId

    const questions = await Question.find(filter)
      .select('-__v -createdAt -updatedAt')
      .lean()
    res.json(questions)
  } catch (err) { next(err) }
}
