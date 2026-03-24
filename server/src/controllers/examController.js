import Exam from '../models/Exam.js'
import Question from '../models/Question.js'
import Subject from '../models/Subject.js'
import Level from '../models/Level.js'

function parseDate(input) {
  if (!input) return null
  const d = new Date(input)
  return Number.isNaN(d.getTime()) ? null : d
}

export async function create(req, res, next) {
  try {
    const { subjectId, levelId, examName, publishDate, questions } = req.body

    if (!subjectId || !levelId) {
      return res.status(400).json({ error: 'subjectId and levelId are required' })
    }
    if (!examName?.trim()) {
      return res.status(400).json({ error: 'examName is required' })
    }
    const pd = parseDate(publishDate)
    if (!pd) return res.status(400).json({ error: 'publishDate is required (valid date)' })
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'questions[] is required' })
    }

    const exam = await Exam.create({
      subjectId,
      levelId,
      examName: examName.trim(),
      // Normalize to midnight for consistent day comparisons (UTC).
      publishDate: new Date(Date.UTC(pd.getUTCFullYear(), pd.getUTCMonth(), pd.getUTCDate())),
    })

    const validQuestions = questions
      .filter(item =>
        item?.q &&
        Array.isArray(item?.opts) &&
        item.ans !== undefined &&
        item.opts.length >= 2
      )
      .map(item => ({
        examId: exam._id,
        examName: exam.examName,
        publishDate: exam.publishDate,
        subjectId,
        levelId,
        q: String(item.q).trim(),
        opts: item.opts.slice(0, 4).map(o => String(o).trim()),
        ans: Math.min(3, Math.max(0, parseInt(item.ans, 10) || 0)),
        marks: parseInt(item.marks, 10) || 1,
        context: String(item.context || '').trim(),
        explanation: String(item.explanation || '').trim(),
        image: item.image || '',
        tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
        wordLinks: item.wordLinks || [],
      }))

    if (validQuestions.length === 0) {
      // Remove exam if nothing valid to insert.
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

export async function list(req, res, next) {
  try {
    const { subjectId } = req.query

    const filter = {}
    if (subjectId) filter.subjectId = subjectId

    const exams = await Exam.find(filter)
      .sort({ publishDate: -1, createdAt: -1 })
      .populate('subjectId', 'name emoji color')
      .populate('levelId', 'name short')
      .lean()

    // Add a small derived flag used by the UI.
    const todayKey = new Date()
    const today = new Date(Date.UTC(
      todayKey.getUTCFullYear(),
      todayKey.getUTCMonth(),
      todayKey.getUTCDate(),
    ))
    const todayISO = today.toISOString().slice(0, 10)

    const withDerived = exams.map(e => {
      const pd = new Date(e.publishDate)
      const pdISO = pd.toISOString().slice(0, 10)
      return {
        _id: e._id,
        examName: e.examName,
        publishDate: e.publishDate,
        isToday: pdISO === todayISO,
        subject: e.subjectId ? { _id: e.subjectId._id, name: e.subjectId.name, emoji: e.subjectId.emoji, color: e.subjectId.color } : null,
        level: e.levelId ? { _id: e.levelId._id, name: e.levelId.name, short: e.levelId.short } : null,
      }
    })

    res.json(withDerived)
  } catch (err) { next(err) }
}

export async function getExamQuestions(req, res, next) {
  try {
    const { examId } = req.params
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
    res.json(exam)
  } catch (err) { next(err) }
}

