import Exam from '../models/Exam.js'
import Question from '../models/Question.js'
import mongoose from 'mongoose'

function parseDateTime(input) {
  if (!input) return null
  const d = new Date(input)
  return Number.isNaN(d.getTime()) ? null : d
}

export function isExamPublished(exam) {
  if (!exam?.publishDate) return false
  return new Date(exam.publishDate).getTime() <= Date.now()
}

/** Student-safe: only exams that have reached publish time */
// export async function list(req, res, next) {
//   try {
//     const { subjectId } = req.query
//     const now = new Date()

//     const filter = { publishDate: { $lte: now } }
//     if (subjectId) filter.subjectId = subjectId
//     // const filter = {}
// if (subjectId) filter.subjectId = subjectId
// // Only show exams whose publishDate has passed (UTC day)
//     filter.publishDate = { $lte: new Date() }
// //     const todayStart = new Date()
// // todayStart.setUTCHours(0, 0, 0, 0)
// //     const filter = { publishDate: { $lte: todayStart } }
// //     if (subjectId) filter.subjectId = subjectId
// //     const todayEnd = new Date()
// // todayEnd.setUTCHours(23, 59, 59, 999)
// // filter.publishDate = { $lte: todayEnd }
// // if (subjectId) filter.subjectId = subjectId

//     const exams = await Exam.find(filter)
//       .sort({ publishDate: -1, createdAt: -1 })
//       .populate('subjectId', 'name emoji color')
//       .populate('levelId', 'name short')
//       .lean()

//     const todayKey = new Date()
//     const today = new Date(Date.UTC(
//       todayKey.getUTCFullYear(),
//       todayKey.getUTCMonth(),
//       todayKey.getUTCDate(),
//     ))
//     const todayISO = today.toISOString().slice(0, 10)

//     const withDerived = exams.map(e => {
//       const pd = new Date(e.publishDate)
//       const pdISO = pd.toISOString().slice(0, 10)
//       return {
//         _id: e._id,
//         examName: e.examName,
//         publishDate: e.publishDate,
//         isToday: pdISO === todayISO,
//         subject: e.subjectId ? { _id: e.subjectId._id, name: e.subjectId.name, emoji: e.subjectId.emoji, color: e.subjectId.color } : null,
//         level: e.levelId ? { _id: e.levelId._id, name: e.levelId.name, short: e.levelId.short } : null,
//       }
//     })

//     res.json(withDerived)
//   } catch (err) { next(err) }
// }

export async function list(req, res, next) {
  try {
    // const { subjectId } = req.query

    // const todayEnd = new Date()
    // todayEnd.setUTCHours(23, 59, 59, 999)

    // const filter = { publishDate: { $lte: todayEnd } }
    // if (subjectId) filter.subjectId = new mongoose.Types.ObjectId(subjectId)

    // const exams = await Exam.find(filter)
    //   .sort({ publishDate: -1, createdAt: -1 })
    //   .populate('subjectId', 'name emoji color')
    //   .populate('levelId', 'name short')
    //   .lean()
    const { subjectId } = req.query

    const todayEnd = new Date()
    todayEnd.setUTCHours(23, 59, 59, 999)

    const filter = { publishDate: { $lte: todayEnd } }
    if (subjectId) filter.subjectId = subjectId  // mongoose auto-casts strings to ObjectId

    console.log('EXAM LIST filter:', JSON.stringify(filter))

    const exams = await Exam.find(filter).lean()

    console.log('EXAM LIST result count:', exams.length)

    const todayISO = new Date().toISOString().slice(0, 10)

    const withDerived = exams.map(e => {
      const pdISO = new Date(e.publishDate).toISOString().slice(0, 10)
      return {
        _id:         e._id,
        examName:    e.examName,
        publishDate: e.publishDate,
        isToday:     pdISO === todayISO,
        subject:     e.subjectId ? { _id: e.subjectId._id, name: e.subjectId.name, emoji: e.subjectId.emoji, color: e.subjectId.color } : null,
        level:       e.levelId   ? { _id: e.levelId._id,   name: e.levelId.name,   short: e.levelId.short   } : null,
      }
    })

    res.json(withDerived)
  } catch (err) { next(err) }
}

/** Admin: all exams including scheduled */
export async function listAllAdmin(req, res, next) {
  try {
    const { subjectId } = req.query
    const filter = {}
    if (subjectId) filter.subjectId = subjectId

    const exams = await Exam.find(filter)
      .sort({ publishDate: -1, createdAt: -1 })
      .populate('subjectId', 'name emoji color')
      .populate('levelId', 'name short')
      .lean()

    res.json(exams)
  } catch (err) { next(err) }
}

export async function patchExam(req, res, next) {
  try {
    const { examId } = req.params
    const { examName, publishDate, pdfRef } = req.body || {}

    const patch = {}
    if (examName !== undefined) {
      const n = String(examName).trim()
      if (!n) return res.status(400).json({ error: 'examName cannot be empty' })
      patch.examName = n
    }
    if (publishDate !== undefined) {
      const pd = parseDateTime(publishDate)
      if (!pd) return res.status(400).json({ error: 'publishDate must be a valid date/datetime' })
      // patch.publishDate = pd
      pd.setUTCHours(0, 0, 0, 0)
      patch.publishDate = pd
    }
    if (pdfRef !== undefined) patch.pdfRef = String(pdfRef)

    const exam = await Exam.findByIdAndUpdate(examId, patch, { new: true, runValidators: true })
    if (!exam) return res.status(404).json({ error: 'Exam not found' })

    const qPatch = {}
    if (patch.examName) qPatch.examName = patch.examName
    if (patch.publishDate) qPatch.publishDate = patch.publishDate

    if (Object.keys(qPatch).length) {
      await Question.updateMany({ examId: exam._id }, { $set: qPatch })
    }

    res.json(exam)
  } catch (err) { next(err) }
}

/**
 * Create exam + questions (PDF or bulk).
 * publishDate: full ISO datetime (not truncated to midnight).
 */
export async function create(req, res, next) {
  try {
    const { subjectId, levelId, examName, publishDate, questions, pdfRef } = req.body

    if (!subjectId || !levelId) {
      return res.status(400).json({ error: 'subjectId and levelId are required' })
    }
    if (!examName?.trim()) {
      return res.status(400).json({ error: 'examName is required' })
    }
    const pd = parseDateTime(publishDate)
    if (!pd) return res.status(400).json({ error: 'publishDate is required (valid ISO datetime)' })
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'questions[] is required' })
    }

    const exam = await Exam.create({
      subjectId,
      levelId,
      examName: examName.trim(),
      // publishDate: pd,
      publishDate: (() => { const d = new Date(pd); d.setUTCHours(0,0,0,0); return d })(),
      pdfRef: pdfRef ? String(pdfRef) : '',
    })

    const validQuestions = questions
      .filter(item =>
        item?.q &&
        Array.isArray(item?.opts) &&
        item.ans !== undefined &&
        item.opts.length >= 2
      )
      .map(item => {
        const diff = ['easy', 'medium', 'hard'].includes(item.difficulty)
          ? item.difficulty
          : 'medium'
        return {
          examId: exam._id,
          examName: exam.examName,
          publishDate: exam.publishDate,
          subjectId,
          levelId,
          difficulty: diff,
          q: String(item.q).trim(),
          opts: item.opts.slice(0, 4).map(o => String(o).trim()),
          ans: Math.min(3, Math.max(0, parseInt(item.ans, 10) || 0)),
          marks: parseInt(item.marks, 10) || 1,
          context: String(item.context || '').trim(),
          explanation: String(item.explanation || '').trim(),
          image: item.image || '',
          tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
          wordLinks: item.wordLinks || [],
        }
      })

    if (validQuestions.length === 0) {
      await Exam.findByIdAndDelete(exam._id)
      return res.status(422).json({ error: 'No valid questions found in questions[]' })
    }

    await Question.insertMany(validQuestions)

    res.status(201).json({
      exam,
      inserted: validQuestions.length,
    })
  } catch (err) { next(err) }
}

export async function getExamQuestions(req, res, next) {
  try {
    const { examId } = req.params
    const exam = await Exam.findById(examId).lean()
    if (!exam) return res.status(404).json({ error: 'Exam not found' })
    if (!isExamPublished(exam)) {
      return res.status(403).json({ error: 'This exam is not available yet' })
    }

    const questions = await Question.find({ examId })
      .sort({ createdAt: 1 })
      .lean()
    res.json(questions)
  } catch (err) { next(err) }
}

export async function getExam(req, res, next) {
  try {
    const { examId } = req.params
    const exam = await Exam.findById(examId)
      .populate('subjectId', 'name emoji color')
      .populate('levelId', 'name short')
      .lean()
    if (!exam) return res.status(404).json({ error: 'Exam not found' })
    if (!isExamPublished(exam)) {
      return res.status(403).json({ error: 'This exam is not available yet' })
    }
    res.json(exam)
  } catch (err) { next(err) }
}

/** Find or create exam for manual question entry (same subject, level, name, publish moment). */
export async function findOrCreateExamDoc({ subjectId, levelId, examName, publishDate }) {
  const pd = parseDateTime(publishDate)
  if (!pd || !examName?.trim()) return null
  const name = examName.trim()
  let exam = await Exam.findOne({
    subjectId,
    levelId,
    examName: name,
    publishDate: pd,
  })
  if (!exam) {
    exam = await Exam.create({
      subjectId,
      levelId,
      examName: name,
      publishDate: pd,
      pdfRef: '',
    })
  }
  return exam
}

export async function getExamQuestionsAdmin(req, res, next) {
  try {
    const questions = await Question.find({ examId: req.params.examId })
      .sort({ createdAt: 1 })
      .lean()
    res.json(questions)
  } catch (err) { next(err) }
}


// DELETE /api/admin/exams/:examId  — removes exam + all its questions
export async function remove(req, res, next) {
  try {
    const { examId } = req.params
    const exam = await Exam.findByIdAndDelete(examId)
    if (!exam) return res.status(404).json({ error: 'Exam not found' })
    await Question.deleteMany({ examId })
    res.json({ message: 'Exam and all its questions deleted' })
  } catch (err) { next(err) }
}

// PATCH /api/admin/exams/:examId  — update exam metadata + sync questions
export async function update(req, res, next) {
  try {
    const { examId } = req.params
    const { examName, subjectId, levelId, publishDate } = req.body

    const pd = publishDate ? new Date(publishDate) : null
    if (publishDate && isNaN(pd?.getTime()))
      return res.status(400).json({ error: 'Invalid publishDate' })

    const updates = {}
    if (examName)   updates.examName    = examName.trim()
    if (subjectId)  updates.subjectId   = subjectId
    if (levelId)    updates.levelId     = levelId
    // if (pd)         updates.publishDate = pd
    if (pd) { pd.setUTCHours(0,0,0,0); updates.publishDate = pd }

    const exam = await Exam.findByIdAndUpdate(examId, updates, { new: true })
    if (!exam) return res.status(404).json({ error: 'Exam not found' })

    // Keep questions in sync
    const qUpdates = {}
    if (updates.examName)    qUpdates.examName    = updates.examName
    if (updates.subjectId)   qUpdates.subjectId   = updates.subjectId
    if (updates.levelId)     qUpdates.levelId     = updates.levelId
    if (updates.publishDate) qUpdates.publishDate = updates.publishDate
    if (Object.keys(qUpdates).length) {
      await Question.updateMany({ examId }, { $set: qUpdates })
    }

    res.json(exam)
  } catch (err) { next(err) }
}