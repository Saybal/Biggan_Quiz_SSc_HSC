/**
 * server/src/index.js  — SEED FUNCTION ONLY (partial file)
 *
 * Replace your existing seed() function in server/src/index.js with this.
 * Also remove: import bcrypt from 'bcryptjs'  (top of file)
 * Also remove: const hash = ... and adminPassword: hash  from Settings.create()
 *
 * Everything else in index.js stays exactly the same.
 */

// ── REMOVE this import from the top of index.js ──────────────────────────────
// import bcrypt from 'bcryptjs'    ← DELETE this line

// ── REPLACE your seed() function with this ───────────────────────────────────
async function seed() {
  const exists = await Settings.findById('global')
  if (exists) return // already seeded

  console.log('🌱 First run — seeding database...')

  // No adminPassword — Firebase handles authentication entirely
  await Settings.create({
    _id:             'global',
    timerMin:        30,
    shuffle:         false,
    showExplanation: true,
    randomQ:         true,
  })

  // Default subjects
  const [math, physics, chemistry] = await Subject.insertMany([
    { name: 'গণিত',   emoji: '🧮', color: '#f7c948' },
    { name: 'পদার্থ', emoji: '🔬', color: '#38b2f5' },
    { name: 'রসায়ন', emoji: '⚗️', color: '#43e97b' },
  ])

  // Default levels
  const [ssc, hsc] = await Level.insertMany([
    { name: 'Class 9-10',  short: 'SSC' },
    { name: 'Class 11-12', short: 'HSC' },
    { name: 'Admission',   short: 'Adm' },
  ])

  // Sample questions
  await Question.insertMany([
    { subjectId: math._id,      levelId: ssc._id, q: 'একটি বৃত্তের ব্যাস ৬ সেমি হলে পরিধি কত?',  opts: ['৬√২ সেমি','১২ সেমি','১৮.৮৫ সেমি','৩৬ সেমি'], ans: 2, marks: 1 },
    { subjectId: math._id,      levelId: ssc._id, q: 'log₅(1/25) এর মান কত?',                      opts: ['25','5','2','-2'],                               ans: 3, marks: 1 },
    { subjectId: physics._id,   levelId: ssc._id, q: 'F = ma সূত্রে a এর একক কী?',                 opts: ['m/s','m/s²','kg','N'],                           ans: 1, marks: 1 },
    { subjectId: chemistry._id, levelId: ssc._id, q: 'পানির রাসায়নিক সংকেত কী?',                  opts: ['HO','H₂O','H₂O₂','OH'],                         ans: 1, marks: 1 },
    { subjectId: chemistry._id, levelId: hsc._id, q: 'pH = 7 মানে দ্রবণটি—',                       opts: ['অম্লীয়','ক্ষারীয়','নিরপেক্ষ','পানীয়'],       ans: 2, marks: 1 },
  ])

  console.log('✅ Seed complete.')
}

// ── Also update the adminRoutes.js import ─────────────────────────────────────
// In server/src/routes/adminRoutes.js, change line 3:
//
// OLD:  import { requireAdmin } from '../middleware/auth.js'
// NEW:  import { requireAdmin } from '../middleware/firebaseAuth.js'
