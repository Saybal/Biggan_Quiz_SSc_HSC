import React from 'react'
import { Link, useNavigate } from 'react-router'
import { useQuiz } from '../../context/QuizContext.jsx'

const LETTERS = ['ক','খ','গ','ঘ']

function renderLinked(text, wordLinks) {
  if (!wordLinks?.length) return text
  let r = text
  ;[...wordLinks].sort((a,b) => b.word.length - a.word.length).forEach(({word,url}) => {
    r = r.replace(word, `<span class="q-linked-word" onclick="window.open('${encodeURIComponent(url)}','_blank','noopener')">${word}<sup style="font-size:.55em">🔗</sup></span>`)
  })
  return r
}

export default function ResultPage() {
  const navigate = useNavigate()
  const { lastResult, subjects, levels, selSubjectId, selLevelId } = useQuiz()

  if (!lastResult) { navigate('/', { replace: true }); return null }

  const { entry, questions, myRank, totalInRanked, showExplanation, participatedOnTime } = lastResult
  const { score, fullMarks, pct, correct, wrong, skip, timeStr, name, school } = entry
  const subject = subjects.find(s => s._id === selSubjectId)
  const level = levels.find(l => l._id === selLevelId)
  
  // console.log("Showing participatedOnTime from resultPage: ", participatedOnTime);
  console.log("lastResult: ", lastResult);
  
  

  let icon, msg
  if (pct >= 90)      { icon='🏆'; msg='অসাধারণ! তুমি জিনিয়াস!' }
  else if (pct >= 70) { icon='🌟'; msg='চমৎকার! অনেক ভালো করেছো!' }
  else if (pct >= 50) { icon='👍'; msg='ভালো চেষ্টা! আরো পড়ো।' }
  else                { icon='📚'; msg='হতাশ হয়ো না, আবার চেষ্টা করো!' }

  const rankDisplay = !participatedOnTime
    ? '—'
    : myRank===1?'🥇':myRank===2?'🥈':myRank===3?'🥉':`#${myRank}`

  return (
    <div className="flex flex-col items-center justify-start min-h-screen px-4 py-8 screen-animate" style={{ background:'var(--bg)' }}>
      <div className="w-full max-w-[620px] pb-10">

        {/* Rank */}
        <div className={`rounded-2xl px-5 py-4 text-center mb-3 ${!participatedOnTime? "display: none" : ""}`} style={{ background:'linear-gradient(135deg,rgba(247,201,72,.12),rgba(255,159,67,.08))', border:'2px solid rgba(247,201,72,.4)' }}>
          <div className="text-muted text-xs mb-1">🏆 তোমার Merit Position</div>
          <div className="font-display font-extrabold text-[3.2rem] gradient-text-accent leading-none">{rankDisplay}</div>
          <div className="text-textprimary text-sm mt-1 font-medium">
            {participatedOnTime ? `${totalInRanked} জনের মধ্যে ${myRank} তম` : 'এই পরীক্ষাটি on-time অংশগ্রহণের জন্য ছিল না'}
          </div>
          <div className="text-muted text-xs mt-0.5">{subject?.emoji} {subject?.name} · {level?.name} · 🏛️ {school}</div>
        </div>

        {/* Score */}
        <div className="bg-card border border-border rounded-card p-5 text-center mb-3">
          <div className="text-5xl mb-2">{icon}</div>
          <div className="text-muted text-sm mb-0.5">তোমার প্রাপ্ত নম্বর</div>
          <div className="font-display font-extrabold text-[2.6rem] gradient-text-accent">{score} / {fullMarks}</div>
          <div className="flex gap-3 justify-center my-3 flex-wrap">
            {[{val:correct,lbl:'সঠিক',color:'var(--green)'},{val:wrong,lbl:'ভুল',color:'var(--accent2)'},{val:skip,lbl:'Skip',color:'var(--muted)'},{val:`${pct}%`,lbl:'শতাংশ',color:'var(--accent)'}].map(item => (
              <div key={item.lbl} className="bg-card2 border border-border rounded-xl px-4 py-2.5 text-center min-w-[80px]">
                <div className="font-display font-extrabold text-[1.4rem]" style={{ color:item.color }}>{item.val}</div>
                <div className="text-muted text-[.72rem] mt-0.5">{item.lbl}</div>
              </div>
            ))}
          </div>
          <div className="text-blue text-sm mb-1">⏱️ সময়: {timeStr}</div>
          <div className="text-textprimary text-[.97rem] my-2 font-medium">{msg}</div>
          <div className="flex gap-2 justify-center flex-wrap">
            <Link to="/quiz/exams" className="px-5 py-2.5 rounded-xl font-display font-bold text-[#1a1200] text-sm transition hover:-translate-y-0.5" style={{ background:'linear-gradient(135deg,var(--accent),#ff9f43)' }}>🔄 আবার খেলো</Link>
            <Link to="/leaderboard" className="px-5 py-2.5 rounded-xl font-display font-bold text-white text-sm transition hover:-translate-y-0.5" style={{ background:'linear-gradient(135deg,var(--blue),#6c63ff)' }}>🏆 Merit List</Link>
            <Link to="/" className="px-5 py-2.5 rounded-xl font-display font-bold text-muted text-sm border border-border transition hover:border-accent hover:text-accent">← হোমে</Link>
          </div>
        </div>

        {/* Review */}
        <div className="bg-card border border-border rounded-card p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="font-display font-bold text-accent">📋 উত্তরপত্র পর্যালোচনা</span>
            <span className="text-muted text-xs">✅{correct} ❌{wrong} ⬜{skip}</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {questions.map((q, i) => {
              const sel=q._selected, isRight=sel===q.ans, un=sel===undefined
              const bc = un?'var(--border)':isRight?'rgba(67,233,123,.3)':'rgba(255,107,107,.3)'
              return (
                <div key={i} className="bg-card2 rounded-xl px-3.5 py-3 border-[1.5px]" style={{ borderColor:bc }}>
                  <div className="flex justify-between text-xs text-muted mb-1">
                    <span>প্রশ্ন {i+1} · {un?'⬜ উত্তর দেওয়া হয়নি':isRight?'✅ সঠিক':'❌ ভুল'}</span>
                    <span className="font-bold" style={{ color:isRight?'var(--green)':'var(--muted)' }}>{isRight?`+${q.marks||1} নম্বর`:'০ নম্বর'}</span>
                  </div>
                  {q.tags?.length>0 && <div className="flex flex-wrap gap-1 mb-1.5">{q.tags.map(t=><span key={t} className="px-2 py-0.5 rounded-full text-[.68rem] bg-purple/10 border border-purple/30 text-purple">#{t}</span>)}</div>}
                  {q.context && <div className="text-blue text-xs mb-1.5">📌 {q.context}</div>}
                  {q.image   && <div className="mb-2"><img src={q.image} alt="" className="max-h-24 rounded-lg border border-border object-contain" onError={e=>e.target.style.display='none'}/></div>}
                  <div className="font-display font-bold text-[.94rem] mb-2 leading-snug"
                    dangerouslySetInnerHTML={q.wordLinks?.length?{__html:renderLinked(q.q,q.wordLinks)}:undefined}>
                    {!q.wordLinks?.length ? q.q : undefined}
                  </div>
                  <div className="flex flex-col gap-1">
                    {q.opts.map((opt,oi) => {
                      let cls='border-border'
                      if (oi===q.ans) cls='border-green bg-green/10 text-green'
                      else if (oi===sel&&!isRight) cls='border-accent2 bg-accent2/10 text-accent2'
                      return (
                        <div key={oi} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-[1.5px] text-sm ${cls}`}>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${oi===q.ans?'bg-green text-[#0d1a10]':oi===sel&&!isRight?'bg-accent2 text-white':'bg-border'}`}>{LETTERS[oi]}</span>
                          {opt}{oi===q.ans?' ✅':''}{oi===sel&&!isRight?' ❌':''}
                        </div>
                      )
                    })}
                  </div>
                  {showExplanation&&q.explanation&&(
                    <div className="mt-2 bg-green/7 border border-green/25 rounded-lg px-3 py-2 text-sm text-green">
                      <strong className="block text-xs uppercase tracking-wider mb-1">💡 ব্যাখ্যা</strong>{q.explanation}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
