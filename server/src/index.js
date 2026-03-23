import 'dotenv/config'
import express     from 'express'
import cors        from 'cors'
import { connectDB }    from './config/db.js'
import authRoutes       from './routes/authRoutes.js'
import publicRoutes     from './routes/publicRoutes.js'
import adminRoutes      from './routes/adminRoutes.js'
import { errorHandler } from './middleware/errorHandler.js'
import Settings         from './models/Settings.js'
import Subject          from './models/Subject.js'
import Level            from './models/Level.js'
import Question         from './models/Question.js'

const app  = express()
const PORT = process.env.PORT || 5000

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '15mb' })) // large limit for base64 images
app.use(express.urlencoded({ extended: true }))

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes)
app.use('/api',       publicRoutes)
app.use('/api/admin', adminRoutes)

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler)

// ── Seed function — runs once on first start ──────────────────────────────────
async function seed() {
  const exists = await Settings.findById('global')
  if (exists) return // already seeded

  console.log('🌱 First run — seeding database...')

  await Settings.create({ _id:'global', timerMin: 30, shuffle: false, showExplanation: true, randomQ: true })

  // Default subjects
  const [math, physics, chemistry] = await Subject.insertMany([
    { name: 'গণিত',   emoji: '🧮', color: '#f7c948' },
    { name: 'পদার্থ', emoji: '🔬', color: '#38b2f5' },
    { name: 'রসায়ন', emoji: '⚗️', color: '#43e97b' },
  ])

  // Default levels
  const [ssc, hsc, adm] = await Level.insertMany([
    { name: 'Class 9-10',  short: 'SSC' },
    { name: 'Class 11-12', short: 'HSC' },
    { name: 'Admission',   short: 'Adm' },
  ])

  // Sample questions
  await Question.insertMany([
    { subjectId: math._id,      levelId: ssc._id, q: 'একটি বৃত্তের ব্যাস ৬ সেমি হলে পরিধি কত?',  opts: ['৬√২ সেমি','১২ সেমি','১৮.৮৫ সেমি','৩৬ সেমি'], ans: 2, marks: 1 },
    { subjectId: math._id,      levelId: ssc._id, q: 'log₅(1/25) এর মান কত?',                      opts: ['25','5','2','-2'],                               ans: 3, marks: 1 },
    { subjectId: math._id,      levelId: hsc._id, q: '3+5+7+… ধারার 21টি পদের সমষ্টি কত?',         opts: ['43','46','483','966'],                           ans: 2, marks: 1 },
    { subjectId: physics._id,   levelId: ssc._id, q: 'পানির রাসায়নিক সংকেত কী?',                   opts: ['HO','H₂O','H₂O₂','OH'],                         ans: 1, marks: 1 },
    { subjectId: chemistry._id, levelId: ssc._id, q: 'pH = 7 মানে দ্রবণটি—',                        opts: ['অম্লীয়','ক্ষারীয়','নিরপেক্ষ','পানীয়'],       ans: 2, marks: 1 },
  ])

  console.log('✅ Seed complete.')
}

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  await connectDB()
  await seed()
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))
}

start().catch(err => { console.error('Fatal:', err); process.exit(1) })
