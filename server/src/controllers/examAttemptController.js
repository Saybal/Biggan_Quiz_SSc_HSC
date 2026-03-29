import Exam from '../models/Exam.js'
import Question from '../models/Question.js'
import ExamAttempt from '../models/ExamAttempt.js'
import { isExamPublished } from './examController.js'

function dateKeyUTC(d) {
  const dt = d instanceof Date ? d : new Date(d)
  return dt.toISOString().slice(0, 10)
}

export async function getAttemptStatus(req, res, next) {
  try {
    const { examId } = req.params
    const exam = await Exam.findById(examId).lean()
    if (!exam) return res.status(404).json({ error: 'Exam not found' })

    const attempt = await ExamAttempt.findOne({ examId, firebaseUid: req.user.uid })
      .sort({ submittedAt: -1 })
      .select('score submittedAt participatedOnTime')
      .lean()

    res.json({
      published: isExamPublished(exam),
      attempted: Boolean(attempt),
      attempt: attempt || null,
    })
  } catch (err) { next(err) }
}

export async function createAttempt(req, res, next) {
  try {
    const {
      examId,
      playerName,
      school,
      answers,
      startedAt: startedAtRaw,
      submittedAt: submittedAtRaw,
      timeSec,
      timeStr,
    } = req.body || {}

    if (!examId) return res.status(400).json({ error: 'examId is required' })
    if (!playerName?.trim()) return res.status(400).json({ error: 'playerName is required' })
    if (!Array.isArray(answers)) return res.status(400).json({ error: 'answers[] is required' })

    const exam = await Exam.findById(examId).lean()
    if (!exam) return res.status(404).json({ error: 'Exam not found' })

    const publishMs = new Date(exam.publishDate).getTime()
    if (Number.isNaN(publishMs)) {
      return res.status(400).json({ error: 'Exam has invalid publish date' })
    }
    if (publishMs > Date.now()) {
      return res.status(403).json({ error: 'This exam is not available yet' })
    }

    // const existing = await ExamAttempt.findOne({ examId, firebaseUid: req.user.uid }).lean()
    // if (existing) {
    //   return res.status(409).json({
    //     error: 'You have already submitted this exam',
    //     attemptId: String(existing._id),
    //   })
    // }

    const startedAt = startedAtRaw ? new Date(startedAtRaw) : new Date()
    const submittedAt = submittedAtRaw ? new Date(submittedAtRaw) : new Date()
    if (Number.isNaN(startedAt.getTime()) || Number.isNaN(submittedAt.getTime())) {
      return res.status(400).json({ error: 'Invalid startedAt/submittedAt' })
    }

    if (startedAt.getTime() < publishMs || submittedAt.getTime() < publishMs) {
      return res.status(400).json({ error: 'Attempt cannot start before the exam publish time' })
    }

    const participatedOnTime =
      startedAt.getTime() >= publishMs &&
      dateKeyUTC(startedAt) === dateKeyUTC(exam.publishDate)

    const questions = await Question.find({ examId }).select('q opts ans marks').lean()
    if (questions.length === 0) return res.status(422).json({ error: 'Exam has no questions yet' })

    const answerMap = new Map(
      answers.map(a => [String(a.questionId), a.selected])
    )

    let correct = 0
    let wrong = 0
    let skip = 0
    let score = 0
    let fullMarks = 0

    for (const q of questions) {
      const marks = q.marks || 1
      fullMarks += marks

      const selected = answerMap.get(String(q._id))
      if (selected === undefined || selected === null) {
        skip++
        continue
      }

      const selectedIdx = Number(selected)
      if (selectedIdx === q.ans) {
        correct++
        score += marks
      } else {
        wrong++
      }
    }

    const pct = fullMarks > 0 ? Math.round((score / fullMarks) * 100) : 0

    const derivedTimeSec =
      typeof timeSec === 'number'
        ? timeSec
        : Math.max(0, Math.round((submittedAt.getTime() - startedAt.getTime()) / 1000))

    let attempt
    try {
      attempt = await ExamAttempt.create({
        firebaseUid: req.user.uid,
        examId: exam._id,
        examName: exam.examName,
        publishDate: exam.publishDate,
        subjectId: exam.subjectId,
        levelId: exam.levelId,

        playerName: playerName.trim(),
        school: school || '',

        startedAt,
        submittedAt,
        participatedOnTime,

        score,
        fullMarks,
        pct,
        correct,
        wrong,
        skip,

        timeSec: derivedTimeSec,
        timeStr: timeStr || `${Math.floor(derivedTimeSec / 60)}মি ${derivedTimeSec % 60}সে`,
      })
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: 'You have already submitted this exam' })
      }
      throw err
    }

    let rank = null
    let total = null

    if (participatedOnTime) {
      rank = await ExamAttempt.countDocuments({
        examId,
        participatedOnTime: true,
        $or: [
          { score: { $gt: attempt.score } },
          { score: attempt.score, submittedAt: { $lt: attempt.submittedAt } },
        ],
      }) + 1

      total = await ExamAttempt.countDocuments({
        examId,
        participatedOnTime: true,
      })
    }

    res.status(201).json({ attempt, rank, total })
  } catch (err) { next(err) }
}

export async function getMyExamMerit(req, res, next) {
  try {
    const { examId } = req.params
    const uid = req.user.uid

    const myAttempt = await ExamAttempt.findOne({ examId, firebaseUid: uid })
      .sort({ score: -1, submittedAt: 1 })
      .lean()

    if (!myAttempt) return res.json({ attempted: false, participatedOnTime: false })

    if (!myAttempt.participatedOnTime) {
      return res.json({ attempted: true, participatedOnTime: false })
    }

    const total = await ExamAttempt.countDocuments({ examId, participatedOnTime: true })
    const rank = await ExamAttempt.countDocuments({
      examId,
      participatedOnTime: true,
      $or: [
        { score: { $gt: myAttempt.score } },
        { score: myAttempt.score, submittedAt: { $lt: myAttempt.submittedAt } },
      ],
    }) + 1

    res.json({ attempted: true, participatedOnTime: true, rank, total })
  } catch (err) { next(err) }
}

export async function getOverallMerit(req, res, next) {
  try {
    const uid = req.user.uid

    const totalParticipants = (await ExamAttempt.distinct('firebaseUid', { participatedOnTime: true }))
      .length

    const ranked = await ExamAttempt.aggregate([
      { $match: { participatedOnTime: true } },
      { $sort: { submittedAt: -1 } },
      {
        $group: {
          _id: '$firebaseUid',
          totalScore: { $sum: '$score' },
          overallFinishedAt: { $max: '$submittedAt' },
          playerName: { $first: '$playerName' },
          school: { $first: '$school' },
        },
      },
      { $sort: { totalScore: -1, overallFinishedAt: 1 } },
      { $limit: 500 },
    ])

    const myRow = ranked.find(r => r._id === uid) || null
    const myRank = myRow ? ranked.findIndex(r => r._id === uid) + 1 : null

    res.json({
      myRank,
      totalParticipants,
      myTotalScore: myRow ? myRow.totalScore : 0,
      rows: ranked.map(r => ({
        firebaseUid: r._id,
        playerName: r.playerName || '',
        school: r.school || '',
        totalScore: r.totalScore,
        overallFinishedAt: r.overallFinishedAt,
      })),
    })
  } catch (err) { next(err) }
}


export async function getExamLeaderboard(req, res, next) {
  try {
    const { examId } = req.params

    const attempts = await ExamAttempt.find({ examId, participatedOnTime: true })
      .sort({ score: -1, submittedAt: 1})
      .lean()

    const leaderboard = attempts.map((a, i) => ({
      rank:       i + 1,
      playerName: a.playerName,
      school:     a.school || '',
      score:      a.score,
      fullMarks:  a.fullMarks,
      pct:        a.pct,
      correct:    a.correct,
      wrong:      a.wrong,
      skip:       a.skip,
      timeStr:    a.timeStr,
      submittedAt: a.submittedAt,
      participatedOnTime: a.participatedOnTime,
      firebaseUid: a.firebaseUid,
    }))

    res.json({ leaderboard, total: leaderboard.length })
  } catch (err) { next(err) }
}