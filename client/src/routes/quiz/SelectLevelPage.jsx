import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQuiz } from '../../context/QuizContext.jsx'
import SelBg from '../../components/layout/SelBg.jsx'
import StepTracker from '../../components/shared/StepTracker.jsx'

export default function SelectLevelPage() {
  const navigate = useNavigate()
  const { subjects, levels, questions, selSubjectId, selLevelId, setSelLevelId } = useQuiz()
  const [error, setError] = useState('')

  const subject = subjects.find(s => s._id === selSubjectId)

  const handleNext = () => {
    if (!selLevelId) { setError('⚠️ একটি Level বেছে নাও!'); return }
    const qCount = questions.filter(q => q.subjectId === selSubjectId && q.levelId === selLevelId).length
    if (!qCount) { setError('⚠️ এই Level-এ কোনো প্রশ্ন নেই!'); return }
    sessionStorage.setItem('qs_levelId', selLevelId)
    navigate('/quiz/join')
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-8 z-10 screen-animate">
      <SelBg patternColor="rgba(167,139,250,0.05)" symbols={['🏫','📖','🎓','✏️','π','∞','Δ','θ']} />
      <div className="relative z-10 flex flex-col items-center w-full max-w-[560px] px-4">
        <StepTracker step={2} />

        <div className="text-center mb-5">
          <div className="text-[2.6rem] mb-1.5">🏫</div>
          <h2 className="font-display font-extrabold text-[2rem] text-textprimary mb-1">Standard বেছে নাও</h2>
          <p className="text-muted text-[.9rem]">{subject ? `${subject.emoji} ${subject.name}` : ''} — তোমার শ্রেণি বেছে নাও</p>
        </div>

        {levels.length === 0 ? (
          <div className="text-muted text-center py-8">কোনো Level নেই।</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 w-full mb-5">
            {levels.map(l => {
              const cnt = questions.filter(q => q.subjectId === selSubjectId && q.levelId === l._id).length
              const sel = selLevelId === l._id
              return (
                <button key={l._id}
                  onClick={() => { setSelLevelId(l._id); setError('') }}
                  className="relative bg-card border-2 rounded-2xl px-3.5 py-4 text-center cursor-pointer transition-all hover:-translate-y-1"
                  style={{ borderColor: sel ? 'var(--purple)' : 'var(--border)', boxShadow: sel ? '0 0 0 2px rgba(167,139,250,.35)' : 'none' }}>
                  {sel && <span className="absolute top-2.5 right-3 text-purple text-sm">✅</span>}
                  <span className="block text-[2.4rem] mb-2">🏫</span>
                  <span className="block font-display font-bold text-[1.05rem]" style={{ color: sel ? 'var(--purple)' : 'var(--text)' }}>{l.name}</span>
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
          <Link to="/quiz/select-subject" className="py-2.5 bg-transparent border border-border text-muted font-display font-semibold rounded-xl text-sm text-center transition hover:border-accent hover:text-accent">
            ← বিষয় পরিবর্তন
          </Link>
        </div>
        {error && <p className="text-accent2 text-sm mt-3 text-center">{error}</p>}
      </div>
    </div>
  )
}
