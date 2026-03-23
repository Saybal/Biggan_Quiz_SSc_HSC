import Result  from '../models/Result.js'
import Subject from '../models/Subject.js'
import Level   from '../models/Level.js'

/** POST /api/results — save a quiz attempt */
export async function create(req, res, next) {
  try {
    const { name, school, subjectId, levelId, score, fullMarks, pct, correct, wrong, skip, timeSec, timeStr } = req.body

    if (!name || score === undefined || !fullMarks || !timeSec)
      return res.status(400).json({ error: 'name, score, fullMarks, timeSec are required' })

    // Denormalise subject + level names for fast leaderboard queries
    const [subject, level] = await Promise.all([
      subjectId ? Subject.findById(subjectId).lean() : null,
      levelId   ? Level.findById(levelId).lean()     : null,
    ])

    const result = await Result.create({
      name, school,
      subjectId, levelId,
      subjectName:  subject?.name  || '',
      subjectEmoji: subject?.emoji || '',
      subjectColor: subject?.color || '',
      levelName:    level?.name    || '',
      levelShort:   level?.short   || '',
      score, fullMarks, pct, correct, wrong, skip, timeSec,
      timeStr: timeStr || `${Math.floor(timeSec/60)}মি ${timeSec%60}সে`,
    })

    // Calculate rank for this submission
    const rankFilter = { ...(subjectId && { subjectId }), ...(levelId && { levelId }) }
    const rank = await Result.countDocuments({
      ...rankFilter,
      $or: [
        { score: { $gt: score } },
        { score, timeSec: { $lt: timeSec } },
      ],
    }) + 1

    const total = await Result.countDocuments(rankFilter)

    res.status(201).json({ result, rank, total })
  } catch (err) { next(err) }
}

/** GET /api/results/leaderboard?subjectId=&levelId=&limit=50 */
export async function leaderboard(req, res, next) {
  try {
    const filter = {}
    if (req.query.subjectId) filter.subjectId = req.query.subjectId
    if (req.query.levelId)   filter.levelId   = req.query.levelId

    const limit = Math.min(parseInt(req.query.limit) || 50, 200)

    const results = await Result.find(filter)
      .sort({ score: -1, timeSec: 1 })
      .limit(limit)
      .lean()

    res.json(results)
  } catch (err) { next(err) }
}

/** GET /api/admin/results — all results with filters [admin] */
export async function getAll(req, res, next) {
  try {
    const filter = {}
    if (req.query.subjectId) filter.subjectId = req.query.subjectId
    if (req.query.levelId)   filter.levelId   = req.query.levelId

    const results = await Result.find(filter)
      .sort({ score: -1, timeSec: 1 })
      .lean()

    // Stats
    const total   = results.length
    const avg     = total ? Math.round(results.reduce((s, r) => s + r.pct, 0) / total) : 0
    const topScore= total ? results[0].score : 0
    const topFull = total ? results[0].fullMarks : 0

    res.json({ results, stats: { total, avg, topScore, topFull } })
  } catch (err) { next(err) }
}

/** DELETE /api/admin/results — clear all [admin] */
export async function clearAll(req, res, next) {
  try {
    await Result.deleteMany({})
    res.json({ message: 'All results cleared' })
  } catch (err) { next(err) }
}
