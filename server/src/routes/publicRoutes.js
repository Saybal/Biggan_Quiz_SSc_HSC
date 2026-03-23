import { Router }     from 'express'
import * as subjects   from '../controllers/subjectController.js'
import * as levels     from '../controllers/levelController.js'
import * as questions  from '../controllers/questionController.js'
import { create as saveResult, leaderboard } from '../controllers/resultController.js'

const router = Router()

// Catalogue (read-only)
router.get('/subjects',   subjects.getAll)
router.get('/levels',     levels.getAll)
router.get('/questions',  questions.getAll)   // ?subjectId=&levelId=

// Quiz play
router.post('/results',   saveResult)
router.get('/results/leaderboard', leaderboard) // ?subjectId=&levelId=&limit=

export default router
