import React, { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { useQuiz } from '../../context/QuizContext.jsx'
import { resultsAPI } from '../../api/index.js'

export default function LeaderboardPage() {
  const { subjects, levels, lastResult } = useQuiz()
  const [results,    setResults]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filterSubj, setFilterSubj] = useState('')
  const [filterLvl,  setFilterLvl]  = useState('')

  useEffect(() => {
    const params = {}
    if (filterSubj) params.subjectId = filterSubj
    if (filterLvl)  params.levelId   = filterLvl
    setLoading(true)
    resultsAPI.leaderboard(params)
      .then(r => setResults(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filterSubj, filterLvl])

  const myEntry  = lastResult?.entry
  const rankIcon = r => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : null
  const rankCls  = r => r === 1 ? 'text-accent text-xl font-extrabold' : r === 2 ? 'text-[#bdc3d4] font-bold' : r === 3 ? 'text-[#cd7f32] font-bold' : 'text-muted text-sm'
  const scoreCls = pct => pct >= 70 ? 'bg-green/15 text-green' : pct >= 40 ? 'bg-accent/15 text-accent' : 'bg-accent2/15 text-accent2'
  const isMe     = p => myEntry && p.name === myEntry.name && p.subjectName === myEntry.subjectName && p.timeSec === myEntry.timeSec

  return (
    <div className="flex flex-col items-center justify-start min-h-screen px-4 py-8 screen-animate" style={{ background:'var(--bg)' }}>
      <div className="w-full max-w-[660px] pb-10">
        <div className="text-center mb-5">
          <h1 className="font-display font-extrabold text-[1.8rem] gradient-text-accent">🏆 Merit List</h1>
          <p className="text-muted text-sm mt-1">নম্বর ও সময় অনুযায়ী rank</p>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap justify-center">
          <select className="bg-card2 border-[1.5px] border-border rounded-xl px-3 py-2 text-textprimary font-body text-sm outline-none cursor-pointer focus:border-accent"
            value={filterSubj} onChange={e => setFilterSubj(e.target.value)}>
            <option value="">— সব বিষয় —</option>
            {subjects.map(s => <option key={s._id} value={s._id}>{s.emoji} {s.name}</option>)}
          </select>
          <select className="bg-card2 border-[1.5px] border-border rounded-xl px-3 py-2 text-textprimary font-body text-sm outline-none cursor-pointer focus:border-accent"
            value={filterLvl} onChange={e => setFilterLvl(e.target.value)}>
            <option value="">— সব Level —</option>
            {levels.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
        </div>

        <div className="bg-card border border-border rounded-card overflow-hidden">
          <div className="grid text-muted text-xs font-semibold uppercase tracking-wide px-4 py-2.5 bg-card2 border-b border-border"
            style={{ gridTemplateColumns:'52px 1fr 90px 100px 80px' }}>
            <div className="text-center">Rank</div><div>নাম</div><div className="text-center">বিষয়</div><div className="text-center">নম্বর</div><div className="text-right">সময়</div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-muted text-sm animate-pulse">লোড হচ্ছে…</div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center text-muted"><div className="text-4xl mb-2">📭</div>এখনো কেউ কুইজ দেয়নি</div>
          ) : results.map((p, i) => {
            const rank = i + 1
            const me   = isMe(p)
            return (
              <div key={p._id} className={`grid px-4 py-3 border-b border-border last:border-b-0 items-center text-sm transition-colors hover:bg-accent/4 ${me ? 'bg-accent/8 border-l-[3px] border-l-accent' : ''}`}
                style={{ gridTemplateColumns:'52px 1fr 90px 100px 80px' }}>
                <div className={`text-center font-display ${rankCls(rank)}`}>{rankIcon(rank) || `#${rank}`}</div>
                <div>
                  <div className={`font-semibold ${me ? 'text-accent' : 'text-textprimary'}`}>
                    {p.name}
                    {me && <span className="ml-1.5 text-[.65rem] bg-accent/15 border border-accent/40 text-accent px-1.5 py-0.5 rounded-full">তুমি</span>}
                  </div>
                  {p.school && <div className="text-muted text-xs mt-0.5">🏛️ {p.school}</div>}
                </div>
                <div className="text-center text-xs text-muted">{p.subjectEmoji} {p.subjectName}</div>
                <div className="text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${scoreCls(p.pct)}`}>{p.score}/{p.fullMarks}</span></div>
                <div className="text-blue text-xs text-right">{p.timeStr || '-'}</div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="px-4 py-2 border border-border text-muted font-display font-semibold text-sm rounded-xl transition hover:border-accent hover:text-accent">
            ← হোমে যাও
          </Link>
        </div>
      </div>
    </div>
  )
}
