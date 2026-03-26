import mongoose from 'mongoose'

const ExamSchema = new mongoose.Schema(
  {
    examName:   { type: String, required: true, trim: true, index: true },
    subjectId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    levelId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Level', required: true, index: true },
    /** Full publish moment (access control: visible/attemptable only when now >= publishDate) */
    publishDate:{ type: Date, required: true, index: true },
    /** Optional reference to uploaded source PDF (URL, storage key, or admin note) */
    pdfRef:     { type: String, default: '' },
  },
  { timestamps: true }
)

export default mongoose.model('Exam', ExamSchema)

