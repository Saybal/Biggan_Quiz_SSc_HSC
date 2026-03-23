/**
 * client/src/routes/public/PaymentSuccessPage.jsx
 *
 * NEW FILE — place at client/src/routes/public/PaymentSuccessPage.jsx
 *
 * SSLCommerz redirects the browser here after a successful payment.
 * We poll the server to confirm the payment is marked as 'success'
 * then redirect to the quiz home.
 */
import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router'
import { paymentAPI, authAPI } from '../../api/index.js'
import { useQuiz } from '../../context/QuizContext.jsx'

export function PaymentSuccessPage() {
  const [params]    = useSearchParams()
  const navigate    = useNavigate()
  const { showToast, loadCatalogue } = useQuiz()
  const [status,  setStatus]  = useState('checking') // checking | confirmed | failed
  const [attempts, setAttempts] = useState(0)

  const tranId = params.get('tran_id')

  useEffect(() => {
    if (!tranId) { setStatus('failed'); return }

    // Poll payment status — server may need a few seconds to process IPN
    const poll = async () => {
      try {
        const res = await paymentAPI.getStatus(tranId)
        if (res.data.status === 'success') {
          setStatus('confirmed')
          showToast('🎉 Payment সফল! Quiz access পেয়েছেন।', 'correct-t')
          // Reload catalogue so quiz is immediately accessible
          await loadCatalogue()
          setTimeout(() => navigate('/quiz/select-subject', { replace: true }), 3000)
        } else if (res.data.status === 'failed' || res.data.status === 'cancelled') {
          setStatus('failed')
        } else {
          // Still pending — retry
          setAttempts(a => a + 1)
        }
      } catch {
        setAttempts(a => a + 1)
      }
    }

    if (attempts < 8) {
      const t = setTimeout(poll, attempts === 0 ? 500 : 2000)
      return () => clearTimeout(t)
    } else {
      setStatus('failed')
    }
  }, [attempts, tranId]) // eslint-disable-line

  if (status === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center" style={{ background:'var(--bg)' }}>
        <div className="text-6xl mb-4 animate-bounce">⏳</div>
        <h2 className="font-display font-extrabold text-xl text-textprimary mb-2">Payment যাচাই হচ্ছে…</h2>
        <p className="text-muted text-sm">একটু অপেক্ষা করুন, এটি স্বয়ংক্রিয় হবে।</p>
        <div className="flex gap-1.5 mt-4 justify-center">
          {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ animationDelay:`${i*0.2}s` }}/>)}
        </div>
      </div>
    )
  }

  if (status === 'confirmed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center screen-animate" style={{ background:'var(--bg)' }}>
        <div className="text-7xl mb-4">🎉</div>
        <h2 className="font-display font-extrabold text-[2rem] text-green mb-2">Payment সফল!</h2>
        <p className="text-muted text-sm mb-2">আপনার quiz access activate হয়েছে।</p>
        <p className="text-muted text-xs mb-6 animate-pulse">কয়েক সেকেন্ডে quiz page-এ নিয়ে যাচ্ছি…</p>
        <Link to="/quiz/select-subject"
          className="px-8 py-3 rounded-xl font-display font-bold text-sm text-[#1a1200] transition hover:-translate-y-0.5"
          style={{ background:'linear-gradient(135deg,var(--accent),#ff9f43)' }}>
          এখনই শুরু করো →
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center" style={{ background:'var(--bg)' }}>
      <div className="text-7xl mb-4">⚠️</div>
      <h2 className="font-display font-extrabold text-[1.6rem] text-accent2 mb-2">Payment যাচাই করা যায়নি</h2>
      <p className="text-muted text-sm mb-1 max-w-sm">আপনার payment সফল হলেও কিছুক্ষণের মধ্যে access পাবেন।</p>
      <p className="text-muted text-xs mb-6">Transaction ID: <span className="text-textprimary font-mono">{tranId}</span></p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link to="/courses" className="px-5 py-2.5 rounded-xl font-display font-bold text-sm border border-border text-muted transition hover:border-accent hover:text-accent">← কোর্সে যাও</Link>
        <button onClick={() => setAttempts(0)} className="px-5 py-2.5 rounded-xl font-display font-bold text-sm text-[#1a1200] transition hover:-translate-y-0.5"
          style={{ background:'linear-gradient(135deg,var(--accent),#ff9f43)' }}>আবার চেক করুন</button>
      </div>
    </div>
  )
}

export function PaymentFailPage() {
  const [params] = useSearchParams()
  const tranId   = params.get('tran_id')

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center screen-animate" style={{ background:'var(--bg)' }}>
      <div className="text-7xl mb-4">❌</div>
      <h2 className="font-display font-extrabold text-[1.8rem] text-accent2 mb-2">Payment ব্যর্থ হয়েছে</h2>
      <p className="text-muted text-sm mb-6 max-w-sm">আপনার payment সম্পন্ন হয়নি। কোনো টাকা কাটা হয়নি।</p>
      {tranId && <p className="text-muted text-xs mb-6">Transaction ID: <span className="text-textprimary font-mono">{tranId}</span></p>}
      <Link to="/courses"
        className="px-8 py-3 rounded-xl font-display font-bold text-sm text-[#1a1200] transition hover:-translate-y-0.5"
        style={{ background:'linear-gradient(135deg,var(--accent),#ff9f43)' }}>
        আবার চেষ্টা করুন →
      </Link>
    </div>
  )
}

export function PaymentCancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center screen-animate" style={{ background:'var(--bg)' }}>
      <div className="text-7xl mb-4">🚫</div>
      <h2 className="font-display font-extrabold text-[1.8rem] text-muted mb-2">Payment বাতিল</h2>
      <p className="text-muted text-sm mb-6">আপনি payment বাতিল করেছেন।</p>
      <Link to="/courses" className="px-8 py-3 rounded-xl font-display font-bold text-sm border border-border text-muted transition hover:border-accent hover:text-accent">
        ← কোর্সে ফিরুন
      </Link>
    </div>
  )
}
