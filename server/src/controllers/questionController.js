import Question from '../models/Question.js'
import Exam from '../models/Exam.js'
import { findOrCreateExamDoc } from './examController.js'

function parseDateTime(input) {
  if (!input) return null
  const d = new Date(input)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Public/student: hide exam-linked questions until publish time */
export async function getAll(req, res, next) {
  try {
    const filter = {}
    if (req.query.examId) filter.examId = req.query.examId
    if (req.query.subjectId) filter.subjectId = req.query.subjectId
    if (req.query.levelId) filter.levelId = req.query.levelId

    const now = new Date()
    filter.$or = [
      { $or: [{ examId: null }, { examId: { $exists: false } }] },
      {
        examId: { $ne: null },
        publishDate: { $exists: true, $ne: null, $lte: now },
      },
    ]

    // if (!req.isAdmin) {  // you'll need to set req.isAdmin in a middleware check
    //   filter.publishDate = { $lte: new Date() }
    // }

    const questions = await Question.find(filter)
      .sort({ createdAt: 1 })
      .lean()
    res.json(questions)
  } catch (err) { next(err) }
}

export async function getAllAdmin(req, res, next) {
  try {
    const filter = {}
    if (req.query.examId)    filter.examId    = req.query.examId
    if (req.query.subjectId) filter.subjectId = req.query.subjectId
    if (req.query.levelId)   filter.levelId   = req.query.levelId
    const questions = await Question.find(filter).sort({ createdAt: 1 }).lean()
    res.json(questions)
  } catch (err) { next(err) }
}

/** Admin: all questions including scheduled */
export async function browseAdmin(req, res, next) {
  try {
    const filter = {}
    if (req.query.subjectId) filter.subjectId = req.query.subjectId
    if (req.query.levelId) filter.levelId = req.query.levelId

    const questions = await Question.find(filter)
      .sort({ createdAt: -1 })
      .lean()
    res.json(questions)
  } catch (err) { next(err) }
}

/**
 * POST /api/admin/questions — manual entry with Exam (subject, level, examName, publishDate required).
 */
// export async function create(req, res, next) {
//   try {
//     const {
//       subjectId,
//       levelId,
//       examName,
//       publishDate,
//       difficulty,
//       q, opts, ans,
//       marks, context, explanation, image, tags, wordLinks,
//     } = req.body

//     if (!subjectId || !levelId) {
//       return res.status(400).json({ error: 'subjectId and levelId are required' })
//     }
//     if (!examName?.trim()) {
//       return res.status(400).json({ error: 'examName is required' })
//     }
//     const pd = parseDateTime(publishDate)
//     if (!pd) {
//       return res.status(400).json({ error: 'publishDate must be a valid date/datetime' })
//     }
//     if (!q?.trim()) return res.status(400).json({ error: 'q is required' })
//     if (!Array.isArray(opts) || opts.length < 2) {
//       return res.status(400).json({ error: 'opts must be an array with at least 2 items' })
//     }
//     if (opts.some(o => !String(o).trim())) {
//       return res.status(400).json({ error: 'All options must be non-empty' })
//     }
//     if (ans === undefined || ans < 0 || ans > 3) {
//       return res.status(400).json({ error: 'ans must be 0–3' })
//     }

//     const exam = await findOrCreateExamDoc({
//       subjectId,
//       levelId,
//       examName,
//       publishDate: pd,
//     })
//     if (!exam) {
//       return res.status(400).json({ error: 'Could not create or resolve exam' })
//     }

//     const diff = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium'

//     const question = await Question.create({
//       examId: exam._id,
//       examName: exam.examName,
//       publishDate: exam.publishDate,
//       subjectId,
//       levelId,
//       difficulty: diff,
//       q: String(q).trim(),
//       opts: opts.slice(0, 4).map(o => String(o).trim()),
//       ans: Math.min(3, Math.max(0, parseInt(ans, 10) || 0)),
//       marks: parseInt(marks, 10) || 1,
//       context: context ? String(context).trim() : '',
//       explanation: explanation ? String(explanation).trim() : '',
//       image: image ? String(image) : '',
//       tags: Array.isArray(tags) ? tags.map(String) : [],
//       wordLinks: wordLinks || [],
//     })
//     res.status(201).json(question)
//   } catch (err) { next(err) }
// }
export async function create(req, res, next) {
  try {
    const { subjectId, levelId, examId, examName, publishDate, q, opts, ans, marks, context, explanation, image, tags, wordLinks } = req.body
    if (!subjectId || !levelId || !q || !opts || ans === undefined)
      return res.status(400).json({ error: 'subjectId, levelId, q, opts, ans are required' })
    if (!Array.isArray(opts) || opts.length < 2)
      return res.status(400).json({ error: 'opts must be an array with at least 2 items' })
    if (!examName?.trim())
      return res.status(400).json({ error: 'examName is required' })
    if (!publishDate)
      return res.status(400).json({ error: 'publishDate is required' })

    const pd = new Date(publishDate)
    if (isNaN(pd.getTime())) return res.status(400).json({ error: 'Invalid publishDate' })

    // Auto-create or find an Exam for this question
    let resolvedExamId = examId
    if (!resolvedExamId) {
      const Exam = (await import('../models/Exam.js')).default
      const existing = await Exam.findOne({ examName: examName.trim(), subjectId, levelId }).lean()
      if (existing) {
        resolvedExamId = existing._id
      } else {
        const newExam = await Exam.create({
          examName: examName.trim(), subjectId, levelId,
          // publishDate: new Date(Date.UTC(pd.getUTCFullYear(), pd.getUTCMonth(), pd.getUTCDate())),
          publishDate: pd,
        })
        resolvedExamId = newExam._id
      }
    }

    const question = await Question.create({
      subjectId, levelId,
      examId: resolvedExamId,
      examName: examName.trim(),
      // publishDate: new Date(Date.UTC(pd.getUTCFullYear(), pd.getUTCMonth(), pd.getUTCDate())),
      publishDate: pd,
      q, opts, ans,
      marks: marks || 1,
      context: context || '',
      explanation: explanation || '',
      image: image || '',
      tags: tags || [],
      wordLinks: wordLinks || [],
    })
    res.status(201).json(question)
  } catch (err) { next(err) }
}

async function syncExamMetadata(examId, examName, publishDate) {
  const exam = await Exam.findById(examId)
  if (!exam) return null
  if (examName !== undefined) {
    const n = String(examName).trim()
    if (!n) throw Object.assign(new Error('examName cannot be empty'), { status: 400 })
    exam.examName = n
  }
  if (publishDate !== undefined) {
    const pd = parseDateTime(publishDate)
    if (!pd) throw Object.assign(new Error('publishDate must be valid'), { status: 400 })
    exam.publishDate = pd
  }
  await exam.save()
  await Question.updateMany(
    { examId: exam._id },
    { $set: { examName: exam.examName, publishDate: exam.publishDate } }
  )
  return exam
}

/** PUT /api/admin/questions/:id */
export async function update(req, res, next) {
  try {
    const prev = await Question.findById(req.params.id)
    if (!prev) return res.status(404).json({ error: 'Question not found' })

    const body = { ...req.body }
    const { examName, publishDate } = body
    delete body.examId

    if (prev.examId && (examName !== undefined || publishDate !== undefined)) {
      try {
        await syncExamMetadata(prev.examId, examName, publishDate)
      } catch (e) {
        return res.status(e.status || 400).json({ error: e.message })
      }
    }

    const question = await Question.findByIdAndUpdate(
      req.params.id,
      body,
      { new: true, runValidators: true }
    )
    if (!question) return res.status(404).json({ error: 'Question not found' })

    if (prev.examId && (examName !== undefined || publishDate !== undefined)) {
      const fresh = await Question.findById(req.params.id).lean()
      return res.json(fresh)
    }
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

/** POST /api/admin/questions/bulk */
export async function bulkCreate(req, res, next) {
  try {
    const { subjectId, levelId, questions } = req.body
    if (!subjectId || !levelId || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'subjectId, levelId, questions[] required' })
    }

    const valid = questions
      .filter(item => item.q && Array.isArray(item.opts) && item.opts.length >= 2 && item.ans !== undefined)
      .map(item => ({
        subjectId,
        levelId,
        q: String(item.q),
        opts: item.opts.map(String),
        ans: parseInt(item.ans),
        marks: parseInt(item.marks) || 1,
        context: item.context || '',
        explanation: item.explanation || '',
        image: item.image || '',
        tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
        difficulty: ['easy', 'medium', 'hard'].includes(item.difficulty) ? item.difficulty : 'medium',
      }))

    const inserted = await Question.insertMany(valid)
    res.status(201).json({ inserted: inserted.length, skipped: questions.length - valid.length })
  } catch (err) { next(err) }
}

/** GET /api/admin/questions/export */
export async function exportQuestions(req, res, next) {
  try {
    const filter = {}
    if (req.query.subjectId) filter.subjectId = req.query.subjectId
    if (req.query.levelId) filter.levelId = req.query.levelId

    const questions = await Question.find(filter)
      .select('-__v -createdAt -updatedAt')
      .lean()
    res.json(questions)
  } catch (err) { next(err) }
}

/** GET /api/admin/collection/questions?subjectId=&examName= */
export async function collectionList(req, res, next) {
  try {
    const { subjectId, examName } = req.query
    if (!subjectId) {
      return res.status(400).json({ error: 'subjectId is required' })
    }
    const filter = { subjectId }
    if (examName?.trim()) {
      filter.examName = examName.trim()
    }

    const questions = await Question.find(filter)
      .sort({ publishDate: -1, examName: 1, createdAt: 1 })
      .lean()
    res.json(questions)
  } catch (err) { next(err) }
}

/**
 * PATCH /api/admin/collection/questions/:id
 * Update question body + examName/publishDate (syncs all questions under same exam).
 */
export async function collectionPatch(req, res, next) {
  try {
    let doc = await Question.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Question not found' })

    const {
      q: text,
      opts,
      ans,
      examName,
      publishDate,
      marks,
      difficulty,
      explanation,
      image,
      context,
    } = req.body || {}

    if (doc.examId && (examName !== undefined || publishDate !== undefined)) {
      try {
        await syncExamMetadata(doc.examId, examName, publishDate)
      } catch (e) {
        return res.status(e.status || 400).json({ error: e.message })
      }
      doc = await Question.findById(req.params.id)
      if (!doc) return res.status(404).json({ error: 'Question not found' })
    }

    if (text !== undefined) {
      const t = String(text).trim()
      if (!t) return res.status(400).json({ error: 'Question text cannot be empty' })
      doc.q = t
    }
    if (opts !== undefined) {
      if (!Array.isArray(opts) || opts.length < 2 || opts.some(o => !String(o).trim())) {
        return res.status(400).json({ error: 'opts must have at least 2 non-empty strings' })
      }
      doc.opts = opts.slice(0, 4).map(o => String(o).trim())
    }
    if (ans !== undefined) {
      const a = parseInt(ans, 10)
      if (Number.isNaN(a) || a < 0 || a > 3) {
        return res.status(400).json({ error: 'ans must be 0–3' })
      }
      doc.ans = a
    }
    if (marks !== undefined) doc.marks = Math.max(1, parseInt(marks, 10) || 1)
    if (difficulty !== undefined) {
      if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        return res.status(400).json({ error: 'difficulty must be easy, medium, or hard' })
      }
      doc.difficulty = difficulty
    }
    if (explanation !== undefined) doc.explanation = String(explanation)
    if (image !== undefined) doc.image = String(image)
    if (context !== undefined) doc.context = String(context)

    await doc.save()
    res.json(await Question.findById(doc._id).lean())
  } catch (err) { next(err) }
}
