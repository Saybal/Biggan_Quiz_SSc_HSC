import mongoose from 'mongoose'

const LevelSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    short: { type: String, default: '' },
  },
  { timestamps: true }
)

export default mongoose.model('Level', LevelSchema)
