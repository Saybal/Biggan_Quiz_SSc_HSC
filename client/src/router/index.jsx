/**
 * client/src/router/index.jsx  (Firebase version)
 *
 * Changes from previous version:
 *   + Added /login  route  → LoginPage
 *   + Added /register route → RegisterPage
 *   - adminLoader now checks auth.currentUser instead of localStorage token
 *   - /admin/login redirects to /login (handled by AdminLoginPage)
 */
import { createBrowserRouter, redirect } from 'react-router'
import React from 'react'

import RootLayout      from '../layouts/RootLayout.jsx'
import PublicLayout    from '../layouts/PublicLayout.jsx'
import QuizFlowLayout  from '../layouts/QuizFlowLayout.jsx'
import AdminLayout     from '../layouts/AdminLayout.jsx'

import HomePage          from '../routes/public/HomePage.jsx'
import LeaderboardPage   from '../routes/public/LeaderboardPage.jsx'
import LoginPage         from '../routes/auth/LoginPage.jsx'       // NEW
import RegisterPage      from '../routes/auth/RegisterPage.jsx'   // NEW
import SelectSubjectPage from '../routes/quiz/SelectSubjectPage.jsx'
import SelectLevelPage   from '../routes/quiz/SelectLevelPage.jsx'
import JoinPage          from '../routes/quiz/JoinPage.jsx'
import ResultPage        from '../routes/quiz/ResultPage.jsx'
import ExamsDashboardPage from '../routes/quiz/ExamsDashboardPage.jsx'
import ExamPlayPage from '../routes/quiz/ExamPlayPage.jsx'
import AdminLoginPage    from '../routes/admin/AdminLoginPage.jsx'
import AdminPage         from '../routes/admin/AdminPage.jsx'
import NotFoundPage      from '../routes/NotFoundPage.jsx'
import ErrorPage         from '../routes/ErrorPage.jsx'

// ── Quiz flow guard (unchanged) ───────────────────────────────────────────────
function quizFlowLoader({ request }) {
  const { pathname } = new URL(request.url)
  const hasSubject = Boolean(sessionStorage.getItem('qs_subjectId'))
  const hasLevel   = Boolean(sessionStorage.getItem('qs_levelId'))
  const hasExam    = Boolean(sessionStorage.getItem('qs_examId'))
  const hasSession = Boolean(sessionStorage.getItem('qs_session'))
  const hasResult  = Boolean(sessionStorage.getItem('qs_result'))
  if (pathname === '/quiz/select-level' && !hasSubject)          return redirect('/quiz/select-subject')
  if (pathname === '/quiz/join' && !hasSubject)                  return redirect('/quiz/select-subject')
  if (pathname === '/quiz/play'   && !hasSession)                return redirect('/quiz/join')
  if (pathname === '/quiz/result' && !hasResult)                 return redirect('/')
  if (pathname === '/quiz/exams' && !hasSubject)                return redirect('/quiz/select-subject')
  // Exam play uses `/quiz/join` as the “join/start exam” step, so require examId.
  if (pathname === '/quiz/join' && hasSubject && !hasLevel && !hasExam) {
    return redirect('/quiz/exams')
  }
  return null
}

// ── Admin guard — checks Firebase auth state ──────────────────────────────────
// NOTE: Loaders run before React renders, so we can't use hooks here.
// We read directly from the Firebase auth object which is a module-level singleton.
// The auth state is already resolved by the time a user navigates (QuizProvider
// calls onAuthStateChanged on mount and sets authLoading=false).
async function adminLoader({ request }) {
  const { pathname } = new URL(request.url)
  if (pathname === '/admin/login') return null

  // Lazy import to avoid circular dependency issues
  const { auth } = await import('../config/firebase.js')

  // If no current user, redirect to login
  if (!auth.currentUser) {
    return redirect('/login?redirect=/admin/dashboard')
  }

  // Get token result to check custom claim
  const tokenResult = await auth.currentUser.getIdTokenResult()
  if (tokenResult.claims.role !== 'admin') {
    return redirect('/?error=not_admin')
  }

  return null
}

const router = createBrowserRouter([
  {
    path:         '/',
    element:      <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true,      element: <HomePage /> },
          { path: 'leaderboard', element: <LeaderboardPage /> },
          { path: 'login',    element: <LoginPage /> },       // NEW
          { path: 'register', element: <RegisterPage /> },   // NEW
        ],
      },
      {
        path:    'quiz',
        element: <QuizFlowLayout />,
        children: [
          { index: true,          loader: () => redirect('/quiz/select-subject') },
          { path: 'select-subject', element: <SelectSubjectPage /> },
          { path: 'exams',          element: <ExamsDashboardPage />, loader: quizFlowLoader },
          { path: 'select-level',   element: <SelectLevelPage />,  loader: quizFlowLoader },
          { path: 'join',           element: <JoinPage />,         loader: quizFlowLoader },
          { path: 'play',           element: <ExamPlayPage />,    loader: quizFlowLoader },
          { path: 'result',         element: <ResultPage />,       loader: quizFlowLoader },
        ],
      },
      {
        path:    'admin',
        element: <AdminLayout />,
        loader:  adminLoader,
        children: [
          { index: true,       loader: () => redirect('/admin/dashboard') },
          { path: 'login',     element: <AdminLoginPage /> },     // redirects to /login
          { path: 'dashboard', element: <AdminPage />, loader: adminLoader },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default router
