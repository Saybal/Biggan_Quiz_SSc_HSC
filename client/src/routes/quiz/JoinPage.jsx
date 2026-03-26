import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQuiz } from '../../context/QuizContext.jsx'
import SelBg from '../../components/layout/SelBg.jsx'
import StepTracker from '../../components/shared/StepTracker.jsx'
import { examsAPI } from '../../api/index.js'

export default function JoinPage() {
  const navigate = useNavigate()
  const {
    user,
    subjects,
    levels,
    questions,
    quizOptions,
    timerMin,
    selSubjectId,
    selLevelId,
    setSelSubjectId,
    setSelLevelId,
    setQuizSession,
    showToast,
  } = useQuiz()

  const [name, setName]     = useState('')
  const [school, setSchool] = useState('')
  const [error, setError]   = useState('')

  const examId = sessionStorage.getItem('qs_examId')
  const [examLoading, setExamLoading] = useState(Boolean(examId))
  const [exam, setExam] = useState(null)
  const [examQuestions, setExamQuestions] = useState([])
  const [examErr, setExamErr] = useState('')
  const [alreadyDone, setAlreadyDone] = useState(false)

  const subject = subjects.find(s => s._id === selSubjectId)
  const level   = levels.find(l => l._id === selLevelId)
  const qCount  = examId
    ? examQuestions.length
    : questions.filter(q => q.subjectId === selSubjectId && q.levelId === selLevelId).length
  const mins    = timerMin || 30

  React.useEffect(() => {
    let alive = true
    async function loadExam() {
      if (!examId) return
      setExamLoading(true)
      setExamErr('')
      try {
        const [eRes, qRes] = await Promise.all([
          examsAPI.getExam(examId),
          examsAPI.getQuestions(examId),
        ])
        if (!alive) return
        setExam(eRes.data)
        setExamQuestions(qRes.data)
        setAlreadyDone(false)

        // Set subject+level for Result rendering and any legacy UI bits.
        const subj = eRes.data?.subjectId?._id ? eRes.data.subjectId : null
        const lvl = eRes.data?.levelId?._id ? eRes.data.levelId : null
        if (subj) setSelSubjectId(subj._id)
        if (lvl) setSelLevelId(lvl._id)

        if (user) {
          try {
            const st = await examsAPI.attemptStatus(examId)
            if (!alive) return
            if (st.data?.attempted) setAlreadyDone(true)
          } catch {
            /* 401: guest — single-attempt still enforced on submit */
          }
        }
      } catch (err) {
        if (!alive) return
        setExamErr(err.response?.data?.error || 'Exam লোড হয়নি')
      } finally {
        if (!alive) return
        setExamLoading(false)
      }
    }
    loadExam()
    return () => { alive = false }
  }, [examId, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = () => {
    if (examId && alreadyDone) {
      setError('⚠️ তুমি ইতিমধ্যে এই পরীক্ষায় অংশ নিয়েছ')
      return
    }
    if (!name.trim())   { setError('⚠️ নাম লিখতে ভুলে গেছো!'); return }
    if (!school.trim()) { setError('⚠️ স্কুল/কলেজের নাম লিখো!'); return }

    const totalSeconds = mins * 60

    let qs = examId
      ? examQuestions
      : questions.filter(q => q.subjectId === selSubjectId && q.levelId === selLevelId)

    if (quizOptions.randomQ) qs = [...qs].sort(() => Math.random() - .5)

    const quizQs = qs.map(q => {
      let opts = [...q.opts], ans = q.ans
      if (quizOptions.shuffle) {
        const idx = [0,1,2,3].sort(() => Math.random() - .5)
        opts = idx.map(i => q.opts[i])
        ans  = idx.indexOf(q.ans)
      }
      return { ...q, opts, ans, _selected: undefined }
    })

    setQuizSession({
      mode: examId ? 'exam' : 'standard',
      examId: examId || null,
      subjectId: selSubjectId || null,
      levelId: selLevelId || null,
      player: name.trim(),
      school: school.trim(),
      questions: quizQs,
      totalSeconds,
      startedAt: Date.now(),
    })
    sessionStorage.setItem('qs_session', 'true')
    sessionStorage.removeItem('qs_result')
    navigate('/quiz/play')
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-8 z-10 screen-animate">
      <SelBg patternColor="rgba(67,233,123,0.05)" symbols={['⏱️','🚀','⚡','🎯','Δt','v₀','★','☄']} />
      <div className="relative z-10 flex flex-col items-center w-full max-w-[480px] px-4">
        <StepTracker step={3} />

        <div className="text-center mb-5">
          <div className="text-[2.6rem] mb-1.5">🚀</div>
          <h2 className="font-display font-extrabold text-[2rem] text-textprimary mb-1">প্রস্তুত?</h2>
          <p className="text-muted text-[.9rem]">
            {exam ? `📌 ${exam.examName}` : `${subject?.emoji} ${subject?.name} · ${level?.name}`}
            {' '}· {qCount} প্রশ্ন
          </p>
        </div>

        {/* Countdown ring */}
        <div className="text-center mb-5">
          <div className="relative w-[130px] h-[130px] mx-auto mb-2">
            <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"/>
              <circle cx="60" cy="60" r="52" fill="none" stroke="url(#tg)" strokeWidth="8"
                strokeDasharray={2*Math.PI*52} strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 60 60)"/>
              <defs><linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#43e97b"/><stop offset="100%" stopColor="#f7c948"/>
              </linearGradient></defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display font-extrabold text-[1.6rem] gradient-text-green leading-none">{String(mins).padStart(2,'0')}:০০</span>
              <span className="text-muted text-[.62rem] mt-0.5 tracking-widest uppercase">মিনিট</span>
            </div>
          </div>
          <p className="text-muted text-xs">শুরু করলেই countdown শুরু হবে</p>
        </div>

        <div className="w-full rounded-[18px] p-5 mb-2 relative overflow-hidden"
          style={{ background:'var(--card)', border:'1px solid var(--border)', boxShadow:'0 8px 40px rgba(0,0,0,.4)' }}>
          <div className="absolute top-0 left-0 right-0 h-[2.5px] rounded-t-[18px]" style={{ background:'linear-gradient(90deg,#43e97b,#38b2f5,#a78bfa)' }}/>

          <div className="mb-3">
            <label className="block text-xs text-muted font-medium mb-1.5">👤 তোমার নাম</label>
            <input className="w-full bg-card2 border-[1.5px] border-border rounded-xl px-3.5 py-2.5 text-textprimary font-body text-[.95rem] outline-none transition-all focus:border-green placeholder-muted"
              type="text" placeholder="পুরো নাম লিখো..." maxLength={40} value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && document.getElementById('school-inp').focus()}/>
          </div>
          <div className="mb-4">
            <label className="block text-xs text-muted font-medium mb-1.5">🏛️ স্কুল / কলেজ</label>
            <input id="school-inp" className="w-full bg-card2 border-[1.5px] border-border rounded-xl px-3.5 py-2.5 text-textprimary font-body text-[.95rem] outline-none transition-all focus:border-green placeholder-muted"
              type="text" placeholder="প্রতিষ্ঠানের নাম..." maxLength={80} value={school} onChange={e => setSchool(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}/>
          </div>

          <button
            onClick={handleStart}
            disabled={examLoading || (examId ? examQuestions.length === 0 : false) || (examId && alreadyDone)}
            className="w-full flex items-center gap-3.5 rounded-[14px] px-4 py-3.5 text-left transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background:'linear-gradient(135deg,#0e1f15,#0a1a28)', border:'1.5px solid rgba(67,233,123,.5)', boxShadow:'0 4px 22px rgba(67,233,123,.14)' }}>
            <span className="text-[2rem] flex-shrink-0" style={{ filter:'drop-shadow(0 0 8px rgba(67,233,123,.5))' }}>🚀</span>
            <span className="flex-1">
              <span className="block font-display font-extrabold text-[1.1rem] text-green">শুরু করো</span>
              <span className="block text-muted text-xs mt-0.5">Timer এখনই চালু হবে</span>
            </span>
            <span className="text-green opacity-70 text-xl font-bold">→</span>
          </button>
          {error && <p className="text-accent2 text-xs mt-3 text-center">{error}</p>}
          {examErr && <p className="text-accent2 text-xs mt-3 text-center">{examErr}</p>}
          {alreadyDone && !examErr && (
            <p className="text-accent2 text-xs mt-3 text-center">এই পরীক্ষায় একবারই অংশগ্রহণ করা যায়। তুমি ইতিমধ্যে জমা দিয়েছ।</p>
          )}
          {examLoading && <p className="text-muted text-xs mt-3 text-center">Exam লোড হচ্ছে...</p>}
        </div>

        <Link to="/quiz/select-level" className="w-full py-2.5 bg-transparent border border-border text-muted font-display font-semibold rounded-xl text-sm text-center block transition hover:border-accent hover:text-accent">
          ← Standard পরিবর্তন করো
        </Link>
      </div>
    </div>
  )
}
