/**
 * client/src/routes/auth/RegisterPage.jsx
 *
 * New file — add route /register in router/index.jsx (see CHANGES.md)
 * Supports: email/password registration + Google sign-in
 */
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQuiz } from '../../context/QuizContext.jsx'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, loginGoogle, showToast } = useQuiz()

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleRegister = async (e) => {
    e?.preventDefault()
    setError('')
    if (!name.trim())             return setError('নাম লিখুন')
    if (!email.trim())            return setError('ইমেইল লিখুন')
    if (password.length < 6)      return setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে')
    if (password !== confirm)     return setError('পাসওয়ার্ড দুটো মিলছে না')

    setLoading(true)
    try {
      await register(email.trim(), password, name.trim())
      showToast('✅ অ্যাকাউন্ট তৈরি হয়েছে!', 'correct-t')
      navigate('/')
    } catch (err) {
      // Map Firebase error codes to Bengali messages
      const code = err.code || ''
      if (code === 'auth/email-already-in-use') setError('এই ইমেইলে আগেই অ্যাকাউন্ট আছে')
      else if (code === 'auth/invalid-email')   setError('সঠিক ইমেইল লিখুন')
      else if (code === 'auth/weak-password')   setError('পাসওয়ার্ড আরো শক্তিশালী করুন')
      else setError(err.message || 'রেজিস্ট্রেশন হয়নি, পুনরায় চেষ্টা করুন')
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true); setError('')
    try {
      await loginGoogle()
      showToast('✅ Google দিয়ে লগইন সফল!', 'correct-t')
      navigate('/')
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user')
        setError('Google লগইন হয়নি, পুনরায় চেষ্টা করুন')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-5 screen-animate" style={{ background:'var(--bg)' }}>
      <div className="text-center mb-6">
        <div className="text-5xl mb-1.5" style={{ filter:'drop-shadow(0 0 16px rgba(67,233,123,.4))' }}>🧪</div>
        <h1 className="font-display font-extrabold text-[2rem] leading-tight">
          <span className="gradient-text-green">নতুন অ্যাকাউন্ট</span>
        </h1>
        <p className="text-muted text-sm mt-1">তোমার বিজ্ঞান কুইজ যাত্রা শুরু করো</p>
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
          Google দিয়ে রেজিস্ট্রেশন
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border"/>
          <span className="text-muted text-xs">অথবা ইমেইল দিয়ে</span>
          <div className="flex-1 h-px bg-border"/>
        </div>

        {/* Form */}
        {[
          { label:'👤 তোমার নাম',      type:'text',     val:name,     set:setName,     ph:'পুরো নাম' },
          { label:'📧 ইমেইল',          type:'email',    val:email,    set:setEmail,    ph:'your@email.com' },
          { label:'🔒 পাসওয়ার্ড',     type:'password', val:password, set:setPassword, ph:'কমপক্ষে ৬ অক্ষর' },
          { label:'🔒 পাসওয়ার্ড নিশ্চিত', type:'password', val:confirm, set:setConfirm, ph:'আবার লিখুন' },
        ].map(f => (
          <div key={f.label} className="mb-3">
            <label className="block text-muted text-xs font-medium mb-1.5">{f.label}</label>
            <input
              type={f.type}
              value={f.val}
              onChange={e => f.set(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              placeholder={f.ph}
              className="w-full bg-card2 border-[1.5px] border-border rounded-xl px-3.5 py-2.5 text-textprimary font-body text-sm outline-none transition focus:border-green placeholder-muted"
            />
          </div>
        ))}

        {error && (
          <div className="bg-accent2/10 border border-accent2/30 text-accent2 text-xs rounded-xl px-3 py-2 mb-3">
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full py-3 rounded-xl font-display font-bold text-sm text-[#0d1a10] mb-3 transition hover:-translate-y-0.5 disabled:opacity-60"
          style={{ background:'linear-gradient(135deg,var(--green),#38b2f5)', boxShadow:'0 4px 20px rgba(67,233,123,.25)' }}
        >
          {loading ? '⏳ তৈরি হচ্ছে…' : 'অ্যাকাউন্ট তৈরি করো →'}
        </button>

        <p className="text-center text-muted text-xs">
          আগেই অ্যাকাউন্ট আছে?{' '}
          <Link to="/login" className="text-blue hover:text-blue/80 font-bold transition">লগইন করো</Link>
        </p>
      </div>
    </div>
  )
}
