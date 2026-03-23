import mongoose from 'mongoose'

export async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not defined in .env')

  await mongoose.connect(uri)
  console.log(`✅ MongoDB connected: ${mongoose.connection.host}`)

  mongoose.connection.on('error', err =>
    console.error('❌ MongoDB error:', err)
  )
  mongoose.connection.on('disconnected', () =>
    console.warn('⚠️  MongoDB disconnected')
  )
}
