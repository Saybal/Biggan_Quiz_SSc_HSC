/**
 * client/src/routes/public/CourseDetailPage.jsx
 *
 * NEW FILE — place at client/src/routes/public/CourseDetailPage.jsx
 *
 * Shows full course details and initiates SSLCommerz payment.
 * After clicking Pay, user is redirected to SSLCommerz hosted page.
 */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { useQuiz } from '../../context/QuizContext.jsx'
import { coursesAPI, paymentAPI } from '../../api/index.js'

export default function CourseDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user, hasPurchased, emailVerified, showToast } = useQuiz()

  const [course,  setCourse]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying,  setPaying]  = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    coursesAPI.getOne(id)
      .then(r => setCourse(r.data))
      .catch(() => setError('Course লোড হয়নি'))
      .finally(() => setLoading(false))
  }, [id])

  const handlePay = async () => {
    if (!user)          return navigate(`/login?redirect=/courses/${id}`)
    if (!emailVerified) return navigate('/login')

    setPaying(true); setError('')
    try {
      const res = await paymentAPI.initiate(id)
      // Redirect browser to SSLCommerz payment page
      window.location.href = res.data.gatewayUrl
    } catch (err) {
      setError(err.response?.data?.error || 'Payment শুরু হয়নি। পুনরায় চেষ্টা করুন।')
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background:'var(--bg)' }}>
        <div className="text-muted text-lg font-display animate-pulse">লোড হচ্ছে…</div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4" style={{ background:'var(--bg)' }}>
        <div className="text-4xl mb-4">❌</div>
        <p className="text-textprimary font-display font-bold mb-4">{error || 'Course পাওয়া যায়নি'}</p>
        <Link to="/courses" className="text-blue hover:underline text-sm">← সব কোর্স দেখুন</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 screen-animate" style={{ background:'var(--bg)' }}>
      <div className="max-w-[720px] mx-auto">

        <Link to="/courses" className="inline-flex items-center gap-1.5 text-muted text-sm hover:text-textprimary transition mb-6">
          ← সব কোর্স
        </Link>

        {/* Header */}
        {course.thumbnail && (
          <img src={course.thumbnail} alt={course.title} className="w-full h-52 object-cover rounded-2xl mb-6 border border-border"/>
        )}

        <h1 className="font-display font-extrabold text-[1.8rem] text-textprimary mb-3 leading-snug">{course.title}</h1>

        {course.description && (
          <p className="text-muted text-sm leading-relaxed mb-5">{course.description}</p>
        )}

        {/* Subjects unlocked */}
        {course.subjectIds?.length > 0 && (
          <div className="mb-5">
            <h3 className="font-display font-bold text-sm text-textprimary mb-2.5">📚 এই কোর্সে যা পাবে:</h3>
            <div className="flex flex-wrap gap-2">
              {course.subjectIds.map(s => (
                <span key={s._id} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border font-bold"
                  style={{ color: s.color || 'var(--accent)', borderColor:`${s.color}40`, background:`${s.color}10` }}>
                  {s.emoji} {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        {course.features?.length > 0 && (
          <div className="mb-6">
            <h3 className="font-display font-bold text-sm text-textprimary mb-2.5">✅ Features:</h3>
            <ul className="space-y-2">
              {course.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted">
                  <span className="text-green flex-shrink-0 font-bold mt-0.5">✓</span>{f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Purchase card */}
        <div className="bg-card border border-border rounded-2xl p-5 sticky bottom-4"
          style={hasPurchased ? { borderColor:'rgba(67,233,123,.4)' } : {}}>

          {hasPurchased ? (
            <div className="text-center">
              <div className="text-green font-display font-bold text-lg mb-3">✅ আপনি এই কোর্সটি কিনেছেন!</div>
              <Link to="/quiz/select-subject"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-display font-bold text-sm text-[#1a1200] transition hover:-translate-y-0.5"
                style={{ background:'linear-gradient(135deg,var(--accent),#ff9f43)' }}>
                কুইজ শুরু করো →
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-display font-extrabold text-[2rem] gradient-text-accent">৳{course.price}</span>
                  <span className="text-muted text-sm ml-1.5">BDT / একবার</span>
                </div>
                <div className="text-xs text-muted text-right">
                  <div>🔒 Secure payment</div>
                  <div>via SSLCommerz</div>
                </div>
              </div>

              {error && (
                <div className="bg-accent2/10 border border-accent2/30 text-accent2 text-xs rounded-xl px-3 py-2 mb-3">⚠️ {error}</div>
              )}

              <button onClick={handlePay} disabled={paying}
                className="w-full py-3.5 rounded-xl font-display font-bold text-base text-[#1a1200] transition hover:-translate-y-0.5 disabled:opacity-60"
                style={{ background:'linear-gradient(135deg,var(--accent),#ff9f43)', boxShadow:'0 4px 20px rgba(247,201,72,.3)' }}>
                {paying
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-[#1a1200]/30 border-t-[#1a1200] rounded-full animate-spin inline-block"/>Payment শুরু হচ্ছে…</span>
                  : user ? '💳 এখনই কিনুন — SSLCommerz' : '🔐 লগইন করে কিনুন'
                }
              </button>

              {!user && (
                <p className="text-center text-muted text-xs mt-2.5">
                  অ্যাকাউন্ট নেই?{' '}
                  <Link to="/register" className="text-green font-bold hover:underline">বিনামূল্যে রেজিস্ট্রেশন</Link>
                </p>
              )}

              <div className="flex items-center justify-center gap-4 mt-3 text-muted text-[.65rem]">
                <span>🏦 bKash</span>
                <span>💳 VISA/Master</span>
                <span>📱 Nagad</span>
                <span>🏪 Rocket</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
