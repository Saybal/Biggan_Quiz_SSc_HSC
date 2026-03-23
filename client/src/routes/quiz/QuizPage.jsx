import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useQuiz } from '../../context/QuizContext.jsx'
import { useTimer } from '../../hooks/useTimer.js'
import { resultsAPI } from '../../api/index.js'

const LETTERS = ['ক','খ','গ','ঘ']

function renderLinked(text, wordLinks) {
  if (!wordLinks?.length) return text
  let r = text
  ;[...wordLinks].sort((a,b) => b.word.length - a.word.length).forEach(({word,url}) => {
    r = r.replace(word, `<span class="q-linked-word" onclick="window.open('${encodeURIComponent(url)}','_blank','noopener')">${word}<sup style="font-size:.55em;opacity:.6">🔗</sup></span>`)
  })
  return r
}

export default function QuizPage() {
  const navigate = useNavigate()
  const { quizSession, setQuizSession, setLastResult, subjects, levels, selSubjectId, selLevelId, quizOptions } = useQuiz()
  const [answered,   setAnswered]   = useState(false)
  const [selected,   setSelected]   = useState(undefined)
  const [submitting, setSubmitting] = useState(false)

  const subject = subjects.find(s => s._id === selSubjectId)
  const level   = levels.find(l => l._id === selLevelId)

  const finishQuiz = useCallback(async (qs) => {
    timer.stop()
    const timeTaken  = (quizSession?.totalSeconds || 1800) - timer.timeLeft
    const mm         = Math.floor(timeTaken / 60), ss = timeTaken % 60
    const finalScore = qs.reduce((a,q) => a + (q._selected === q.ans ? (q.marks||1) : 0), 0)
    const fullMarks  = qs.reduce((a,q) => a + (q.marks||1), 0)
    const pct        = fullMarks > 0 ? Math.round((finalScore / fullMarks) * 100) : 0
    const correct    = qs.filter(q => q._selected === q.ans).length
    const wrong      = qs.filter(q => q._selected !== undefined && q._selected !== q.ans).length
    const skip       = qs.filter(q => q._selected === undefined).length

    const payload = {
      name: quizSession.player, school: quizSession.school,
      subjectId: selSubjectId,  levelId: selLevelId,
      score: finalScore, fullMarks, pct, correct, wrong, skip,
      timeSec: timeTaken, timeStr: `${mm}মি ${ss}সে`,
    }

    try {
      const res = await resultsAPI.save(payload)
      const { result, rank, total } = res.data
      setLastResult({ entry: result, questions: qs, myRank: rank, totalInRanked: total, showExplanation: quizOptions.showExplanation })
    } catch {
      // even if API fails, show result with local data
      setLastResult({ entry: { ...payload, subjectName: subject?.name, subjectEmoji: subject?.emoji, levelName: level?.name, timeStr: `${mm}মি ${ss}সে` }, questions: qs, myRank: '?', totalInRanked: '?', showExplanation: quizOptions.showExplanation })
    }

    sessionStorage.setItem('qs_result', 'true')
    sessionStorage.removeItem('qs_session')
    navigate('/quiz/result')
  }, [quizSession, selSubjectId, selLevelId, quizOptions]) // eslint-disable-line

  const onExpire = useCallback(() => {
    setSubmitting(true)
    setTimeout(() => finishQuiz(quizSession?.questions || []), 1800)
  }, [quizSession, finishQuiz])

  const timer = useTimer(quizSession?.totalSeconds || 1800, onExpire)
  useEffect(() => { timer.start() }, []) // eslint-disable-line

  if (!quizSession) return null

  const { questions, currentQ, score } = quizSession
  const q = questions[currentQ]
  const total = questions.length
  const progress = ((currentQ + 1) / total) * 100

  const handleSelect = (idx) => {
    if (answered || submitting) return
    setAnswered(true); setSelected(idx)
    const newQs = [...questions]
    newQs[currentQ] = { ...newQs[currentQ], _selected: idx }
    setQuizSession({ ...quizSession, questions: newQs, score: score + (idx === q.ans ? (q.marks||1) : 0) })
  }

  const handleNext = () => {
    if (currentQ + 1 >= total) { finishQuiz(quizSession.questions) }
    else { setQuizSession({ ...quizSession, currentQ: currentQ + 1 }); setAnswered(false); setSelected(undefined) }
  }

  return (
    <div className="flex items-stretch justify-center gap-0 min-h-screen px-2 py-4 screen-animate" style={{ background:'var(--bg)' }}>
      {/* Left deco */}
      <div className="hidden lg:flex flex-col items-start justify-center gap-3.5 w-40 flex-shrink-0 px-2.5 py-5 opacity-55 pointer-events-none">
        <div className="relative w-14 h-14 mb-1">
          <div className="nucleus" style={{ width:10,height:10,background:'var(--blue)',boxShadow:'0 0 8px var(--blue)' }}/>
          <div className="orbit o1"><div className="electron" style={{ width:7,height:7 }}/></div>
          <div className="orbit o2"><div className="electron e2" style={{ width:7,height:7 }}/></div>
        </div>
        {['F = ma','E = hf','PV = nRT','a² + b² = c²'].map(f => (
          <span key={f} className="font-mono text-xs text-blue/50" style={{ animation:'floatSym 6s ease-in-out infinite' }}>{f}</span>
        ))}
      </div>

      {/* Quiz card */}
      <div className="flex-1 max-w-[560px] flex flex-col bg-card border border-border rounded-[22px] px-6 py-5 shadow-[0_8px_48px_rgba(0,0,0,.5)] relative overflow-hidden self-start" style={{ marginTop:16 }}>
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[22px]" style={{ background:'linear-gradient(90deg,var(--blue),var(--green),var(--accent),var(--accent2))' }}/>

        {/* Topbar */}
        <div className="flex justify-between items-start mb-3.5">
          <div className="flex flex-col gap-1">
            <span className="text-accent font-semibold text-sm">👤 {quizSession.player}</span>
            <div className="flex flex-wrap gap-1.5">
              {subject && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border" style={{ background:`${subject.color}20`, borderColor:`${subject.color}60`, color:subject.color }}>{subject.emoji} {subject.name}</span>}
              {level   && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border border-purple/35 text-purple bg-purple/12">🏫 {level.short||level.name}</span>}
            </div>
          </div>
          <div className={`flex items-center gap-1.5 border rounded-xl px-3 py-1.5 font-display font-bold text-base tracking-wide transition-all ${timer.warn ? 'border-accent2 text-accent2 bg-accent2/8' : 'border-border text-textprimary bg-card2'}`}
            style={timer.warn ? { animation:'pulseWarn .8s infinite' } : {}}>
            ⏱️ <span>{timer.fmt()}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="bg-card2 rounded-full h-1.5 mb-2 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-400" style={{ width:`${progress}%`, background:'linear-gradient(90deg,var(--accent),#ff9f43)' }}/>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted text-xs">প্রশ্ন {currentQ+1} / {total}</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${(q.marks||1)>1 ? 'bg-orange/12 border border-orange/35 text-orange' : 'bg-accent/12 border border-accent/30 text-accent'}`}>✦ {q.marks||1} নম্বর</span>
          </div>
        </div>

        {/* Question */}
        <div className="rounded-2xl px-4 py-4 mb-4 relative" style={{ background:'linear-gradient(135deg,rgba(56,178,245,.05),rgba(167,139,250,.04))', border:'1px solid rgba(56,178,245,.15)' }}>
          <div className="absolute -top-3 right-2.5 w-7 h-7 rounded-full flex items-center justify-center font-display font-extrabold text-base text-white" style={{ background:'linear-gradient(135deg,var(--blue),var(--purple))', boxShadow:'0 2px 10px rgba(56,178,245,.4)' }}>?</div>
          {q.context && <div className="text-blue text-sm bg-blue/8 border border-blue/25 rounded-lg px-3 py-2 mb-3">📌 {q.context}</div>}
          {q.image   && <div className="mb-3 rounded-xl overflow-hidden border border-border max-h-[200px]"><img src={q.image} alt="" className="w-full max-h-[200px] object-contain bg-bg" onError={e=>e.target.parentElement.style.display='none'}/></div>}
          <div className="font-display font-bold text-[1.12rem] leading-[1.55] text-textprimary pr-8 whitespace-pre-line"
            dangerouslySetInnerHTML={q.wordLinks?.length ? { __html: renderLinked(q.q, q.wordLinks) } : undefined}>
            {!q.wordLinks?.length ? q.q : undefined}
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2.5 mb-4">
          {q.opts.map((opt, i) => {
            let cls='bg-card2 border-border text-textprimary hover:border-accent hover:bg-accent/7 hover:translate-x-1', lCls='bg-border text-textprimary'
            if (answered) {
              if (i===q.ans)                        { cls='border-green bg-green/10 text-green cursor-default';         lCls='bg-green text-[#0d1a10]' }
              else if (i===selected && i!==q.ans)   { cls='border-accent2 bg-accent2/10 text-accent2 cursor-default';  lCls='bg-accent2 text-white'   }
              else                                  { cls='border-border bg-card2 text-muted cursor-default opacity-60' }
            } else if (selected===i) { cls='border-accent bg-accent/9 translate-x-1'; lCls='bg-accent text-[#1a1200]' }
            return (
              <button key={i} onClick={() => handleSelect(i)} disabled={answered||submitting}
                className={`flex items-center gap-2.5 border-[1.5px] rounded-[13px] px-4 py-3 text-left font-body text-[.95rem] transition-all duration-200 ${cls}`}>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-display font-extrabold text-[.82rem] flex-shrink-0 ${lCls}`}>{LETTERS[i]}</span>
                {opt}
              </button>
            )
          })}
        </div>

        {answered && !submitting && (
          <button onClick={handleNext} className="w-full py-3 font-display font-bold text-[.98rem] rounded-xl text-[#1a1200] transition hover:-translate-y-0.5"
            style={{ background:'linear-gradient(135deg,var(--accent),#ff9f43)', boxShadow:'0 4px 20px rgba(247,201,72,.25)' }}>
            {currentQ+1>=total ? 'ফলাফল দেখো 🎉' : 'পরের প্রশ্ন →'}
          </button>
        )}
        {submitting && <div className="text-center text-accent2 text-sm font-semibold animate-pulse mt-2">⏰ সময় শেষ! জমা হচ্ছে…</div>}
      </div>

      {/* Right deco */}
      <div className="hidden lg:flex flex-col items-end justify-center gap-3.5 w-40 flex-shrink-0 px-2.5 py-5 opacity-55 pointer-events-none">
        <div className="flex flex-col items-center mb-1.5">
          <div className="w-7 h-1 bg-blue/40 rounded-sm"/>
          <div className="w-4 h-3.5 border border-blue/30 bg-blue/15"/>
          <div className="w-11 h-12 border border-blue/30 bg-blue/8 rounded-b-xl relative overflow-hidden">
            <div className="qsr-bk-liquid"/><div className="qsr-bubble b1"/><div className="qsr-bubble b2"/><div className="qsr-bubble b3"/>
          </div>
        </div>
        {['λ = v/f','sin²θ+cos²θ=1','log(ab)=loga+logb'].map(f => (
          <span key={f} className="font-mono text-xs text-blue/50 text-right" style={{ animation:'floatSym 6s ease-in-out infinite' }}>{f}</span>
        ))}
      </div>
    </div>
  )
}
