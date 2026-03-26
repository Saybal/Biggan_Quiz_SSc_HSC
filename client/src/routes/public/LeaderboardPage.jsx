import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQuiz } from '../../context/QuizContext.jsx'
import { examsAPI } from '../../api/index.js'

export default function LeaderboardPage() {
  const navigate = useNavigate()
  const { user, authLoading, showToast } = useQuiz()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [myRank, setMyRank] = useState(null)
  const [totalParticipants, setTotalParticipants] = useState(0)

  useEffect(() => {
    let alive = true

    if (!authLoading && !user) {
      navigate('/login?redirect=/leaderboard', { replace: true })
      return
    }

    setLoading(true)
    examsAPI.overallMerit()
      .then(r => {
        if (!alive) return
        console.log(r.data);
        setRows(r.data.rows || [])
        setMyRank(r.data.myRank ?? null)
        setTotalParticipants(r.data.totalParticipants ?? 0)
      })
      .catch(err => {
        if (!alive) return
        showToast('Merit লোড হয়নি', 'wrong-t')
      })
      .finally(() => {
        if (!alive) return
        setLoading(false)
      })

    return () => { alive = false }
  }, [authLoading, user, navigate, showToast])

  const rankIcon = r => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : null
  const rankCls  = r => r === 1 ? 'text-accent text-xl font-extrabold' : r === 2 ? 'text-[#bdc3d4] font-bold' : r === 3 ? 'text-[#cd7f32] font-bold' : 'text-muted text-sm'
  const isMe     = (r) => user && r.firebaseUid === user.uid
  const formatDate = (d) => {
    const dt = new Date(d)
    if (Number.isNaN(dt.getTime())) return '-'
    return dt.toISOString().slice(0, 10)
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen px-4 py-8 screen-animate" style={{ background:'var(--bg)' }}>
      <div className="w-full max-w-[660px] pb-10">
        <div className="text-center mb-5">
          <h1 className="font-display font-extrabold text-[1.8rem] gradient-text-accent">🏆 Merit List</h1>
          <p className="text-muted text-sm mt-1">On-time অংশগ্রহণের সব পরীক্ষার সর্বমোট স্কোর অনুযায়ী rank</p>
        </div>

        {myRank ? (
          <div className="mb-4 bg-card2 border border-border rounded-2xl px-4 py-3 text-center">
            <div className="text-muted text-xs">তোমার Merit Position</div>
            <div className="font-display font-extrabold text-[1.8rem] text-accent mt-0.5">#{myRank}</div>
            <div className="text-muted text-xs mt-0.5">{rows.find(r => r.firebaseUid === user?.uid)?.totalScore || 0} total marks</div>
          </div>
        ) : null}

        <div className="bg-card border border-border rounded-card overflow-hidden">
          <div className="grid text-muted text-xs font-semibold uppercase tracking-wide px-4 py-2.5 bg-card2 border-b border-border"
            style={{ gridTemplateColumns:'52px 1fr 140px 140px' }}>
            <div className="text-center">Rank</div><div>নাম</div><div className="text-center">Total Marks</div><div className="text-right">Finished Date</div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-muted text-sm animate-pulse">লোড হচ্ছে…</div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-muted">
              <div className="text-4xl mb-2">📭</div>
              এখনো কেউ on-time exam দেয়নি
            </div>
          ) : rows.map((p, i) => {
            const rank = i + 1
            const me   = isMe(p)
            return (
              <div
                key={p.firebaseUid}
                className={`grid px-4 py-3 border-b border-border last:border-b-0 items-center text-sm transition-colors hover:bg-accent/4 ${me ? 'bg-accent/8 border-l-[3px] border-l-accent' : ''}`}
                style={{ gridTemplateColumns:'52px 1fr 140px 140px' }}
              >
                <div className={`text-center font-display ${rankCls(rank)}`}>{rankIcon(rank) || `#${rank}`}</div>
                <div>
                  <div className={`font-semibold ${me ? 'text-accent' : 'text-textprimary'}`}>
                    {p.playerName || 'User'}
                    {me && <span className="ml-1.5 text-[.65rem] bg-accent/15 border border-accent/40 text-accent px-1.5 py-0.5 rounded-full">তুমি</span>}
                  </div>
                  {p.school && <div className="text-muted text-xs mt-0.5">🏛️ {p.school}</div>}
                </div>
                <div className="text-center text-xs">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green/15 text-green">
                    {p.totalScore}
                  </span>
                </div>
                <div className="text-blue text-xs text-right">{formatDate(p.overallFinishedAt)}</div>
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
