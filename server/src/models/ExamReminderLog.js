import mongoose from 'mongoose'

const ExamReminderLogSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    // UTC YYYY-MM-DD for when the reminder is being sent
    reminderDateKey: { type: String, required: true, index: true },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
)

ExamReminderLogSchema.index({ examId: 1, reminderDateKey: 1 }, { unique: true })

export default mongoose.model('ExamReminderLog', ExamReminderLogSchema)

