import { Router }        from 'express'
import multer            from 'multer'
import { requireAdmin } from '../middleware/firebaseAuth.js'
import * as subjects     from '../controllers/subjectController.js'
import * as levels       from '../controllers/levelController.js'
import * as questions    from '../controllers/questionController.js'
import * as results      from '../controllers/resultController.js'
import * as settings     from '../controllers/settingsController.js'
import { parsePdf }      from '../controllers/pdfController.js'
import * as exams from '../controllers/examController.js'
import * as users from '../controllers/userController.js'


// multer: store PDF in memory (no disk write, max 10 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
})

const router = Router()

// All admin routes are protected
router.use(requireAdmin)

// ── Subjects ──────────────────────────────────────────────────────────────────
router.post  ('/subjects',     subjects.create)
router.put   ('/subjects/:id', subjects.update)
router.delete('/subjects/:id', subjects.remove)

// ── Levels ────────────────────────────────────────────────────────────────────
router.post  ('/levels',     levels.create)
router.put   ('/levels/:id', levels.update)
router.delete('/levels/:id', levels.remove)

// ── Questions ─────────────────────────────────────────────────────────────────
router.get   ('/questions/browse', questions.browseAdmin)
router.post  ('/questions',        questions.create)
router.post  ('/questions/bulk',   questions.bulkCreate)
router.get   ('/questions/export', questions.exportQuestions)
router.put   ('/questions/:id',    questions.update)
router.delete('/questions/:id', questions.remove)
// router.get('/questions/all', questions.getAllAdmin)

// ── Collection (subject → exam filter, bulk metadata edit) ──────────────────
router.get   ('/collection/questions',      questions.collectionList)
router.patch ('/collection/questions/:id',  questions.collectionPatch)

// ── Results ───────────────────────────────────────────────────────────────────
router.get   ('/results',          results.getAll)
router.delete('/results', results.clearAll)
// After the existing results routes, add:
router.get('/results/by-exam', results.getAll)          // ?examId=
router.get('/results/:id/detail', results.getDetail)    // single attempt detail

// ── Settings ──────────────────────────────────────────────────────────────────
router.get  ('/settings',          settings.get)
router.patch('/settings',          settings.update)

// ── PDF → Quiz ────────────────────────────────────────────────────────────────
router.post ('/pdf/parse', upload.single('pdf'), parsePdf)

// ── Exams (admin creates exam + stores its questions) ─────────────────────────
router.get  ('/exams',            exams.listAllAdmin)
router.patch('/exams/:examId',   exams.patchExam)
router.post('/exams', exams.create)

router.patch ('/exams/:examId', exams.update)
router.delete('/exams/:examId', exams.remove)

router.get('/exams/:examId/questions', exams.getExamQuestionsAdmin)

router.get  ('/students',                       users.listStudents)
router.patch('/students/:firebaseUid/purchase', users.updatePurchase)

export default router
