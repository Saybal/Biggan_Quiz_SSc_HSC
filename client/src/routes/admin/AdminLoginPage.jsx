/**
 * client/src/routes/admin/AdminLoginPage.jsx  (Firebase version)
 *
 * Admins no longer have a separate login page.
 * This page just redirects to /login?redirect=/admin/dashboard
 * so admins use the same login form as regular users.
 * After login, the Firebase custom claim determines if they see admin panel.
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useQuiz } from '../../context/QuizContext.jsx'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { user, isAdminAuthed, authLoading } = useQuiz()

  useEffect(() => {
    if (authLoading) return

    if (user && isAdminAuthed) {
      // Already logged in as admin — go straight to dashboard
      navigate('/admin/dashboard', { replace: true })
    } else {
      // Send to main login with a redirect param
      navigate('/login?redirect=/admin/dashboard', { replace: true })
    }
  }, [user, isAdminAuthed, authLoading, navigate])

  return null  // renders nothing — just redirects
}
