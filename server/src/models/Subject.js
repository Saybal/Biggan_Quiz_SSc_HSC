import mongoose from 'mongoose'

const SubjectSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    emoji: { type: String, default: '📚' },
    color: { type: String, default: '#f7c948' },
  },
  { timestamps: true }
)

export default mongoose.model('Subject', SubjectSchema)
