import { Router }     from 'express'
import * as subjects   from '../controllers/subjectController.js'
import * as levels     from '../controllers/levelController.js'
import * as questions  from '../controllers/questionController.js'
import { create as saveResult, leaderboard } from '../controllers/resultController.js'
import { requireAuth } from '../middleware/firebaseAuth.js'
import * as exams from '../controllers/examController.js'
import * as examAttempts from '../controllers/examAttemptController.js'
import { sendExamReminders } from '../controllers/emailController.js'

const router = Router()

// Catalogue (read-only)
router.get('/subjects',   subjects.getAll)
router.get('/levels',     levels.getAll)
router.get('/questions',  questions.getAll)   // ?subjectId=&levelId=

// Quiz play
router.post('/results',   saveResult)
router.get('/results/leaderboard', leaderboard) // ?subjectId=&levelId=&limit=

// Exams (static paths before :examId)
router.get('/exams', exams.list) // ?subjectId=
router.get('/exams/:examId/attempt-status', requireAuth, examAttempts.getAttemptStatus)
router.get('/exams/:examId', exams.getExam)
router.get('/exams/:examId/questions', exams.getExamQuestions)

// Exam attempts + merit (auth required)
router.post('/exams/attempts', requireAuth, examAttempts.createAttempt)
router.get('/exams/:examId/merit', requireAuth, examAttempts.getMyExamMerit)
router.get('/merit/overall', requireAuth, examAttempts.getOverallMerit)

// Cron: send Bengali reminder emails (secret-protected)
router.post('/cron/send-exam-reminders', sendExamReminders)

// router.get('/admin/settings', getSettings)
// router.patch('/admin/settings', updateSettings)

export default router
