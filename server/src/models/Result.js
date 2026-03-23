import mongoose from 'mongoose'

const ResultSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true },
    school:       { type: String, default: '' },
    subjectId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    levelId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Level' },
    // Denormalised for fast leaderboard queries (no $lookup needed)
    subjectName:  { type: String },
    subjectEmoji: { type: String },
    subjectColor: { type: String },
    levelName:    { type: String },
    levelShort:   { type: String },
    // Scores
    score:        { type: Number, required: true },
    fullMarks:    { type: Number, required: true },
    pct:          { type: Number, required: true },
    correct:      { type: Number, default: 0 },
    wrong:        { type: Number, default: 0 },
    skip:         { type: Number, default: 0 },
    timeSec:      { type: Number, required: true },
    timeStr:      { type: String },
  },
  { timestamps: true }
)

// Leaderboard sort: score desc, time asc
ResultSchema.index({ subjectId: 1, levelId: 1, score: -1, timeSec: 1 })

export default mongoose.model('Result', ResultSchema)
