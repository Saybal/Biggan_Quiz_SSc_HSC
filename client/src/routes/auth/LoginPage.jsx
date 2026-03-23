/**
 * client/src/routes/auth/LoginPage.jsx
 *
 * New file — add route /login in router/index.jsx (see CHANGES.md)
 * Used by ALL users (both regular users and admins).
 * After login, the app reads the Firebase custom claim to determine role.
 */
import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useQuiz } from '../../context/QuizContext.jsx'

export default function LoginPage() {
  const navigate        = useNavigate()
  const [searchParams]  = useSearchParams()
  const { login, loginGoogle, showToast } = useQuiz()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  // Where to redirect after login (default: home)
  const redirect = searchParams.get('redirect') || '/'

  const handleLogin = async (e) => {
    e?.preventDefault()
    setError('')
    if (!email.trim() || !password) return setError('ইমেইল ও পাসওয়ার্ড লিখুন')
    setLoading(true)
    try {
      await login(email.trim(), password)
      showToast('✅ লগইন সফল!', 'correct-t')
      navigate(redirect, { replace: true })
    } catch (err) {
      const code = err.code || ''
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential')
        setError('ইমেইল বা পাসওয়ার্ড ভুল')
      else if (code === 'auth/too-many-requests')
        setError('অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন')
      else if (code === 'auth/invalid-email')
        setError('সঠিক ইমেইল লিখুন')
      else
        setError(err.message || 'লগইন হয়নি, পুনরায় চেষ্টা করুন')
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true); setError('')
    try {
      await loginGoogle()
      showToast('✅ Google দিয়ে লগইন সফল!', 'correct-t')
      navigate(redirect, { replace: true })
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user')
        setError('Google লগইন হয়নি, পুনরায় চেষ্টা করুন')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-5 screen-animate" style={{ background:'var(--bg)' }}>
      <div className="text-center mb-6">
        <div className="text-5xl mb-1.5" style={{ filter:'drop-shadow(0 0 16px rgba(247,201,72,.4))' }}>⚗️</div>
        <h1 className="font-display font-extrabold text-[2rem] leading-tight">
          <span className="gradient-text-accent">লগইন করো</span>
        </h1>
        <p className="text-muted text-sm mt-1">তোমার কুইজ অ্যাকাউন্টে প্রবেশ করো</p>
      </div>

      <div className="bg-card border border-border rounded-card px-6 py-6 w-full max-w-[420px] shadow-[0_8px_48px_rgba(0,0,0,.5)]">

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-border text-textprimary font-display font-bold text-sm mb-4 transition hover:border-blue hover:bg-blue/5 disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google দিয়ে লগইন
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border"/>
          <span className="text-muted text-xs">অথবা ইমেইল দিয়ে</span>
          <div className="flex-1 h-px bg-border"/>
        </div>

        <div className="mb-3">
          <label className="block text-muted text-xs font-medium mb-1.5">📧 ইমেইল</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && document.getElementById('loginPass').focus()}
            placeholder="your@email.com"
            className="w-full bg-card2 border-[1.5px] border-border rounded-xl px-3.5 py-2.5 text-textprimary font-body text-sm outline-none transition focus:border-accent placeholder-muted"/>
        </div>
        <div className="mb-4">
          <label className="block text-muted text-xs font-medium mb-1.5">🔒 পাসওয়ার্ড</label>
          <input id="loginPass" type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="তোমার পাসওয়ার্ড"
            className="w-full bg-card2 border-[1.5px] border-border rounded-xl px-3.5 py-2.5 text-textprimary font-body text-sm outline-none transition focus:border-accent placeholder-muted"/>
        </div>

        {error && (
          <div className="bg-accent2/10 border border-accent2/30 text-accent2 text-xs rounded-xl px-3 py-2 mb-3">
            ⚠️ {error}
          </div>
        )}

        <button onClick={handleLogin} disabled={loading}
          className="w-full py-3 rounded-xl font-display font-bold text-sm text-[#1a1200] mb-3 transition hover:-translate-y-0.5 disabled:opacity-60"
          style={{ background:'linear-gradient(135deg,var(--accent),#ff9f43)', boxShadow:'0 4px 20px rgba(247,201,72,.25)' }}>
          {loading ? '⏳ প্রবেশ হচ্ছে…' : 'লগইন করো →'}
        </button>

        <p className="text-center text-muted text-xs">
          অ্যাকাউন্ট নেই?{' '}
          <Link to="/register" className="text-green hover:text-green/80 font-bold transition">রেজিস্ট্রেশন করো</Link>
        </p>
      </div>
    </div>
  )
}
