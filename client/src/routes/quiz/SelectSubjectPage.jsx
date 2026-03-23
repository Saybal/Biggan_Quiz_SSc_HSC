import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQuiz } from '../../context/QuizContext.jsx'
import SelBg from '../../components/layout/SelBg.jsx'
import StepTracker from '../../components/shared/StepTracker.jsx'

export default function SelectSubjectPage() {
  const navigate = useNavigate()
  const { subjects, questions, selSubjectId, setSelSubjectId, catalogueLoading } = useQuiz()
  const [error, setError] = useState('')

  const handleNext = () => {
    if (!selSubjectId) { setError('⚠️ একটি বিষয় বেছে নাও!'); return }
    sessionStorage.setItem('qs_subjectId', selSubjectId)
    navigate('/quiz/select-level')
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-8 z-10 screen-animate">
      <SelBg />
      <div className="relative z-10 flex flex-col items-center w-full max-w-[560px] px-4">
        <StepTracker step={1} />

        <div className="text-center mb-5">
          <div className="text-[2.6rem] mb-1.5">📚</div>
          <h2 className="font-display font-extrabold text-[2rem] text-textprimary mb-1">বিষয় বেছে নাও</h2>
          <p className="text-muted text-[.9rem]">কোন বিষয়ের কুইজ দিতে চাও?</p>
        </div>

        {catalogueLoading ? (
          <div className="text-muted text-center py-10 animate-pulse">বিষয় লোড হচ্ছে…</div>
        ) : subjects.length === 0 ? (
          <div className="text-muted text-center py-8">কোনো বিষয় নেই। Admin থেকে যোগ করুন।</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 w-full mb-5">
            {subjects.map(s => {
              const cnt = questions.filter(q => q.subjectId === s._id).length
              const sel = selSubjectId === s._id
              return (
                <button key={s._id}
                  onClick={() => { setSelSubjectId(s._id); setError('') }}
                  className="relative bg-card border-2 rounded-2xl px-3.5 py-4 text-center cursor-pointer transition-all hover:-translate-y-1 overflow-hidden"
                  style={{ borderColor: sel ? s.color : 'var(--border)', boxShadow: sel ? `0 0 0 2px ${s.color}40` : 'none' }}>
                  {sel && <span className="absolute top-2.5 right-3 text-sm" style={{ color: s.color }}>✅</span>}
                  <span className="block text-[2.4rem] mb-2">{s.emoji}</span>
                  <span className="block font-display font-bold text-[1.05rem]" style={{ color: sel ? s.color : 'var(--text)' }}>{s.name}</span>
                  <span className="block text-muted text-xs mt-1">{cnt} টি প্রশ্ন</span>
                </button>
              )
            })}
          </div>
        )}

        <div className="flex flex-col gap-2 w-full">
          <button onClick={handleNext}
            className="flex items-center justify-center gap-2 rounded-xl py-3.5 font-display font-extrabold text-lg text-white transition-all hover:-translate-y-0.5"
            style={{ background:'linear-gradient(135deg,#38b2f5,#a78bfa)', boxShadow:'0 4px 20px rgba(56,178,245,.28)' }}>
            পরবর্তী <span className="text-xl">→</span>
          </button>
          <Link to="/" className="py-2.5 bg-transparent border border-border text-muted font-display font-semibold rounded-xl text-sm text-center transition hover:border-accent hover:text-accent">
            ← হোমে যাও
          </Link>
        </div>
        {error && <p className="text-accent2 text-sm mt-3 text-center">{error}</p>}
      </div>
    </div>
  )
}
