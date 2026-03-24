import 'dotenv/config'
import express     from 'express'
import cors        from 'cors'
import { connectDB }    from './src/config/db.js'
import authRoutes       from './src/routes/authRoutes.js'
import publicRoutes     from './src/routes/publicRoutes.js'
import adminRoutes      from './src/routes/adminRoutes.js'
import { errorHandler } from './src/middleware/errorHandler.js'
import Settings         from './src/models/Settings.js'
import Subject          from './src/models/Subject.js'
import Level            from './src/models/Level.js'
import Question         from './src/models/Question.js'


const app  = express()
const PORT = process.env.PORT || 5000

// ── Middleware ────────────────────────────────────────────────────────────────
// app.use(cors({
//   origin:      process.env.CLIENT_URL || 'http://localhost:5173',
//   credentials: true,
// }))
// Keep CORS environment-based so the Firebase-hosted client can call Vercel.
// If you set `CLIENT_URLS` (comma-separated) you can restrict origins.
// Otherwise, allow all in production to avoid accidental production breakage.
const clientUrls = String(process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
  .split(',')
  .map(s => s.trim().replace(/\/$/, ''))
  .filter(Boolean)
const allowAllCors =
  clientUrls.includes('*') ||
  process.env.CORS_ALLOW_ALL === 'true' ||
  process.env.NODE_ENV === 'production'

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    if (allowAllCors) return cb(null, true)
    if (clientUrls.some(u => origin.replace(/\/$/, '') === u)) return cb(null, true)
    return cb(new Error(`CORS blocked: ${origin} is not allowed`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
// async function start() {
//   await connectDB()
//   await seed()
//   app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))
// }

// start().catch(err => { console.error('Fatal:', err); process.exit(1) })

let isConnected = false

async function init() {
  if (!isConnected) {
    await connectDB()
    await seed()
    isConnected = true
    console.log("✅ DB connected & seeded")
  }
}

export default async function handler(req, res) {
  await init()

  // Vercel rewrites can sometimes strip the original path from `req.url`.
  // Restore it from forwarded headers so Express routes (e.g. `/api/*`) work.
  const forwarded =
    req.headers['x-forwarded-uri'] ||
    req.headers['x-vercel-forwarded-path'] ||
    req.headers['x-original-url'] ||
    req.headers['x-original-uri']
  if (typeof forwarded === 'string' && forwarded.startsWith('/')) {
    req.url = forwarded
  }

  return app(req, res)
}

// Local development mode (nodemon/node):
// Vercel imports the default handler and does not need app.listen().
if (process.env.VERCEL !== '1') {
  init()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`)
      })
    })
    .catch(err => {
      console.error('Fatal startup error:', err)
      process.exit(1)
    })
}
