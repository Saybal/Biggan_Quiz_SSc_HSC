import mongoose from 'mongoose'

const ExamSchema = new mongoose.Schema(
  {
    examName:   { type: String, required: true, trim: true, index: true },
    subjectId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    levelId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Level', required: true, index: true },
    publishDate:{ type: Date, required: true, index: true },
  },
  { timestamps: true }
)

export default mongoose.model('Exam', ExamSchema)

