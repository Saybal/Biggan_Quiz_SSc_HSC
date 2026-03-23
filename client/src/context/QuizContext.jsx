/**
 * client/src/context/QuizContext.jsx  (Firebase version — auth section only)
 *
 * WHAT CHANGED from the previous version:
 *   - Removed: adminLogin(password), isAdminAuthed, localStorage token handling
 *   - Added:   useFirebaseAuth() hook integrated directly
 *   - user, role, authLoading, login, loginGoogle, logout, register now exposed
 *
 * The rest of the context (catalogue, quiz session, toast) is unchanged.
 * Paste this file over client/src/context/QuizContext.jsx
 */
import React, {
  createContext, useContext, useState,
  useCallback, useEffect,
} from 'react'
import { subjectsAPI, levelsAPI, questionsAPI, settingsAPI } from '../api/index.js'
import { useFirebaseAuth } from '../hooks/useFirebaseAuth.js'

const QuizContext = createContext(null)

export function QuizProvider({ children }) {

  // ── Firebase auth (replaces old password-based auth) ─────────────────────
  const {
    user, role, loading: authLoading,
    register, login, loginGoogle, logout, getIdToken,
  } = useFirebaseAuth()

  const isAdminAuthed = role === 'admin'

  // ── Catalogue ─────────────────────────────────────────────────────────────
  const [subjects,  setSubjects]  = useState([])
  const [levels,    setLevels]    = useState([])
  const [questions, setQuestions] = useState([])
  const [timerMin,     setTimerMin]     = useState(30)
  const [quizOptions,  setQuizOptions]  = useState({ shuffle: false, showExplanation: true, randomQ: true })
  const [catalogueLoading, setCatalogueLoading] = useState(true)
  const [catalogueError,   setCatalogueError]   = useState(null)

  // ── Quiz session ──────────────────────────────────────────────────────────
  const [selSubjectId, setSelSubjectId] = useState(null)
  const [selLevelId,   setSelLevelId]   = useState(null)
  const [quizSession,  setQuizSession]  = useState(null)
  const [lastResult,   setLastResult]   = useState(null)

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState({ visible: false, msg: '', cls: '' })
  const showToast = useCallback((msg, cls = 'info-t') => {
    setToast({ visible: true, msg, cls })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2400)
  }, [])

  // ── Load catalogue ────────────────────────────────────────────────────────
  const loadCatalogue = useCallback(async () => {
    setCatalogueLoading(true)
    setCatalogueError(null)
    try {
      const [sRes, lRes, qRes, stRes] = await Promise.all([
        subjectsAPI.getAll(),
        levelsAPI.getAll(),
        questionsAPI.getAll({}),
        settingsAPI.get().catch(() => null),
      ])
      setSubjects(sRes.data)
      setLevels(lRes.data)
      setQuestions(qRes.data)
      if (stRes?.data) {
        setTimerMin(stRes.data.timerMin || 30)
        setQuizOptions({
          shuffle:         stRes.data.shuffle         ?? false,
          showExplanation: stRes.data.showExplanation ?? true,
          randomQ:         stRes.data.randomQ         ?? true,
        })
      }
    } catch (err) {
      setCatalogueError('সার্ভার থেকে ডেটা লোড করা যায়নি।')
      console.error(err)
    } finally {
      setCatalogueLoading(false)
    }
  }, [])

  useEffect(() => { loadCatalogue() }, [loadCatalogue])

  const refreshSubjects  = async () => { const r = await subjectsAPI.getAll();  setSubjects(r.data) }
  const refreshLevels    = async () => { const r = await levelsAPI.getAll();    setLevels(r.data) }
  const refreshQuestions = async (p = {}) => { const r = await questionsAPI.getAll(p); setQuestions(r.data) }

  return (
    <QuizContext.Provider value={{
      // ── Firebase auth ─────────────────────────────────────────────────────
      user,              // Firebase user object (or null)
      role,              // 'admin' | 'user' | null
      authLoading,       // true while Firebase resolves initial state
      isAdminAuthed,     // shorthand: role === 'admin'
      register,          // (email, password, displayName) → Promise
      login,             // (email, password) → Promise
      loginGoogle,       // () → Promise
      logout,            // () → Promise
      getIdToken,        // () → Promise<string> — for manual use if needed

      // ── Catalogue ─────────────────────────────────────────────────────────
      subjects, levels, questions,
      catalogueLoading, catalogueError, loadCatalogue,
      refreshSubjects, refreshLevels, refreshQuestions,

      // ── Settings ──────────────────────────────────────────────────────────
      timerMin, setTimerMin, quizOptions, setQuizOptions,

      // ── Quiz session ──────────────────────────────────────────────────────
      selSubjectId, setSelSubjectId,
      selLevelId,   setSelLevelId,
      quizSession,  setQuizSession,
      lastResult,   setLastResult,

      // ── UI ────────────────────────────────────────────────────────────────
      toast, showToast,
    }}>
      {children}
    </QuizContext.Provider>
  )
}

export const useQuiz = () => useContext(QuizContext)
