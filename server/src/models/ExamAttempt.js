import mongoose from 'mongoose'

const ExamAttemptSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, index: true },

    examId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    examName:     { type: String, required: true },
    publishDate:  { type: Date, required: true, index: true },
    subjectId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    levelId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Level', required: true, index: true },

    // Participant info
    playerName: { type: String, required: true },
    school:     { type: String, default: '' },

    // Participation timing
    startedAt:          { type: Date, required: true, index: true },
    submittedAt:        { type: Date, required: true, index: true },
    participatedOnTime: { type: Boolean, required: true, index: true },

    // Scores
    score:     { type: Number, required: true },
    fullMarks: { type: Number, required: true },
    pct:       { type: Number, required: true },
    correct:   { type: Number, default: 0 },
    wrong:     { type: Number, default: 0 },
    skip:      { type: Number, default: 0 },

    timeSec: { type: Number, required: true },
    timeStr: { type: String },
  },
  { timestamps: false }
)

// Merit ranking sort: score desc, submittedAt asc
ExamAttemptSchema.index({ examId: 1, participatedOnTime: 1, score: -1, submittedAt: 1 })

// One attempt per user per exam (critical)
ExamAttemptSchema.index({ firebaseUid: 1, examId: 1 }, { unique: true })
// Add this line after the existing indexes:
// ExamAttemptSchema.index({ firebaseUid: 1, examId: 1 }, { unique: true })

// Overall merit ranking sort: user totals are computed via aggregation

export default mongoose.model('ExamAttempt', ExamAttemptSchema)

