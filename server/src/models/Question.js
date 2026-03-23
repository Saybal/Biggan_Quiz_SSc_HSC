import mongoose from 'mongoose'

const QuestionSchema = new mongoose.Schema(
  {
    subjectId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    levelId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Level',   required: true, index: true },
    q:           { type: String, required: true },
    opts:        { type: [String], required: true, validate: v => v.length >= 2 },
    ans:         { type: Number, required: true, min: 0, max: 3 },
    marks:       { type: Number, default: 1, min: 1 },
    context:     { type: String, default: '' },
    explanation: { type: String, default: '' },
    image:       { type: String, default: '' },   // URL or base64
    tags:        { type: [String], default: [] },
    wordLinks:   [{ word: String, url: String }],
  },
  { timestamps: true }
)

// Compound index for fast subject+level filtering
QuestionSchema.index({ subjectId: 1, levelId: 1 })

export default mongoose.model('Question', QuestionSchema)
