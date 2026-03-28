/**
 * AdminPage.jsx — Full admin dashboard
 * All data fetched from/written to the Express API via Axios.
 * Includes the new PDF Upload tab for AI-powered quiz generation.
 */
// Change the examsAPI import line in api/index.js — already has examsAPI
// In AdminPage.jsx, add to the import line:
import { subjectsAPI, levelsAPI, questionsAPI, resultsAPI, settingsAPI, pdfAPI, adminExamsAPI, examsAPI, studentsAPI } from '../../api/index.js'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQuiz } from '../../context/QuizContext.jsx'
// import { subjectsAPI, levelsAPI, questionsAPI, resultsAPI, settingsAPI, pdfAPI, adminExamsAPI } from '../../api/index.js'

function toDatetimeLocalValue(isoOrDate) {
  if (!isoOrDate) return ''
  const x = new Date(isoOrDate)
  if (Number.isNaN(x.getTime())) return ''
  const p = n => String(n).padStart(2, '0')
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`
}

// ── Shared UI micro-components ────────────────────────────────────────────────
const EMOJIS = ['🧮','📐','🔬','⚗️','🧪','🌍','📖','🖊️','🧬','💡','🔭','📊','🏛️','🌿','🩺','💻','🎨','🎵','⚽','🌏','🧑‍🔬','📝','🔢','🏫','🎓']
const LETTERS = ['ক','খ','গ','ঘ']
const scoreCls = pct => pct>=70?'bg-green/15 text-green':pct>=40?'bg-accent/15 text-accent':'bg-accent2/15 text-accent2'

function Inp({ className='', ...p }) {
  return <input className={`w-full bg-card2 border-[1.5px] border-border rounded-xl px-3.5 py-2.5 text-textprimary font-body text-sm outline-none transition focus:border-accent placeholder-muted ${className}`} {...p}/>
}
function Sel({ className='', ...p }) {
  return <select className={`w-full bg-card2 border-[1.5px] border-border rounded-xl px-3 py-2 text-textprimary font-body text-sm outline-none cursor-pointer focus:border-accent ${className}`} {...p}/>
}
function Btn({ variant='outline', children, ...p }) {
  const v = {
    green:  { cls:'border-transparent text-[#0d1a10]',         bg:'linear-gradient(135deg,#43e97b,#38b2f5)' },
    blue:   { cls:'border-transparent text-white',             bg:'linear-gradient(135deg,#38b2f5,#6c63ff)' },
    purple: { cls:'border-transparent text-white',             bg:'linear-gradient(135deg,#a78bfa,#6c63ff)' },
    accent: { cls:'border-transparent text-[#1a1200]',         bg:'linear-gradient(135deg,var(--accent),#ff9f43)' },
    danger: { cls:'border-accent2/40 text-accent2 bg-transparent', bg:'none' },
    outline:{ cls:'border-border text-muted bg-transparent hover:border-accent hover:text-accent', bg:'none' },
  }[variant] || { cls:'border-border text-muted bg-transparent', bg:'none' }
  return <button className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-display font-bold rounded-lg border transition hover:-translate-y-0.5 cursor-pointer ${v.cls}`} style={{ background:v.bg }} {...p}>{children}</button>
}
function Modal({ open, onClose, title, size='md', children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-3.5" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className={`bg-card border border-border rounded-card p-5 w-full shadow-[0_16px_64px_rgba(0,0,0,.6)] max-h-[92vh] overflow-y-auto screen-animate ${size==='sm'?'max-w-[400px]':'max-w-[560px]'}`}>
        <div className="font-display font-bold text-[1.15rem] text-accent mb-4">{title}</div>
        {children}
      </div>
    </div>
  )
}
function Row({ label, children }) {
  return <div className="mb-3"><label className="block text-muted text-xs font-medium mb-1.5">{label}</label>{children}</div>
}

// ── Results Tab ───────────────────────────────────────────────────────────────
// function ResultsTab() {
//   const { subjects, levels, showToast } = useQuiz()
//   const [data,   setData]   = useState({ results:[], stats:{} })
//   const [fSubj,  setFSubj]  = useState('')
//   const [fLvl,   setFLvl]   = useState('')
//   const [loading,setLoading]= useState(true)

//   const load = useCallback(async () => {
//     setLoading(true)
//     try {
//       const params = {}
//       if (fSubj) params.subjectId = fSubj
//       if (fLvl)  params.levelId   = fLvl
//       const r = await resultsAPI.getAll(params)
//       setData(r.data)
//     } catch { showToast('Results লোড হয়নি','wrong-t') }
//     setLoading(false)
//   }, [fSubj, fLvl]) // eslint-disable-line

//   useEffect(() => { load() }, [load])

//   const handleClear = async () => {
//     if (!confirm('সব Result মুছে ফেলবো?')) return
//     await resultsAPI.clearAll()
//     showToast('🗑️ মুছা হয়েছে','wrong-t')
//     load()
//   }

//   const re = ['🥇','🥈','🥉']
//   const { results=[], stats={} } = data

//   return (
//     <div>
//       <div className="flex gap-2 mb-3 flex-wrap">
//         <Sel className="w-auto text-xs py-1.5 px-2.5" value={fSubj} onChange={e=>setFSubj(e.target.value)}>
//           <option value="">— সব বিষয় —</option>
//           {subjects.map(s=><option key={s._id} value={s._id}>{s.emoji} {s.name}</option>)}
//         </Sel>
//         <Sel className="w-auto text-xs py-1.5 px-2.5" value={fLvl} onChange={e=>setFLvl(e.target.value)}>
//           <option value="">— সব Level —</option>
//           {levels.map(l=><option key={l._id} value={l._id}>{l.name}</option>)}
//         </Sel>
//       </div>
//       <div className="grid grid-cols-3 gap-2.5 mb-4">
//         {[{num:stats.total||0,lbl:'মোট Participant'},{num:stats.avg?stats.avg+'%':'-',lbl:'গড় নম্বর'},{num:stats.topScore?`${stats.topScore}/${stats.topFull}`:'-',lbl:'সর্বোচ্চ'}].map(s=>(
//           <div key={s.lbl} className="bg-card border border-border rounded-xl p-3 text-center">
//             <div className="font-display font-extrabold text-[1.7rem] text-accent">{s.num}</div>
//             <div className="text-muted text-xs mt-0.5">{s.lbl}</div>
//           </div>
//         ))}
//       </div>
//       <div className="bg-card border border-border rounded-xl overflow-hidden">
//         <div className="grid text-muted text-xs font-semibold uppercase tracking-wide px-3.5 py-2 bg-card2 border-b border-border" style={{gridTemplateColumns:'30px 1fr 80px 68px 100px 72px'}}>
//           <div>#</div><div>নাম</div><div>বিষয়</div><div>Level</div><div>নম্বর</div><div className="text-right">সময়</div>
//         </div>
//         {loading ? <div className="py-8 text-center text-muted text-sm animate-pulse">লোড হচ্ছে…</div>
//         : results.length===0 ? <div className="py-8 text-center text-muted text-sm"><div className="text-3xl mb-2">📭</div>কোনো Result নেই</div>
//         : results.map((p,i)=>(
//           <div key={p._id} className="grid px-3.5 py-2.5 border-b border-border last:border-0 items-center text-sm hover:bg-accent/3" style={{gridTemplateColumns:'30px 1fr 80px 68px 100px 72px'}}>
//             <div className={`font-display font-bold ${i<3?'text-accent':'text-muted'}`}>{i<3?re[i]:i+1}</div>
//             <div>
//               <div className="font-semibold text-textprimary text-[.88rem]">{p.name}</div>
//               {p.school&&<div className="text-muted text-[.72rem]">🏛️ {p.school}</div>}
//             </div>
//             <div className="text-xs text-muted">{p.subjectEmoji} {p.subjectName}</div>
//             <div><span className="text-xs text-purple bg-purple/10 border border-purple/30 px-2 py-0.5 rounded-full">{p.levelShort||p.levelName}</span></div>
//             <div><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreCls(p.pct)}`}>{p.score}/{p.fullMarks} ({p.pct}%)</span></div>
//             <div className="text-blue text-xs text-right">{p.timeStr}</div>
//           </div>
//         ))}
//       </div>
//       <div className="mt-3"><Btn variant="danger" onClick={handleClear}>🗑️ সব Result মুছুন</Btn></div>
//     </div>
//   )
// }

// ── Results Tab — Now styled like Leaderboard ───────────────────────────────
// function ResultsTab() {
//   const { subjects, levels, showToast } = useQuiz()
//   const [data,   setData]   = useState({ results:[], stats:{} })
//   const [fSubj,  setFSubj]  = useState('')
//   const [fLvl,   setFLvl]   = useState('')
//   const [loading,setLoading]= useState(true)

//   const load = useCallback(async () => {
//     setLoading(true)
//     try {
//       const params = {}
//       if (fSubj) params.subjectId = fSubj
//       if (fLvl)  params.levelId   = fLvl
//       const r = await resultsAPI.getAll(params)
//       setData(r.data)
//     } catch {
//       showToast('Results লোড হয়নি', 'wrong-t')
//     }
//     setLoading(false)
//   }, [fSubj, fLvl, showToast])

//   useEffect(() => { load() }, [load])

//   const handleClear = async () => {
//     if (!confirm('সব Result মুছে ফেলবো?')) return
//     await resultsAPI.clearAll()
//     showToast('🗑️ সব Result মুছে ফেলা হয়েছে', 'wrong-t')
//     load()
//   }

//   const { results = [], stats = {} } = data

//   // Helper functions (same as LeaderboardPage)
//   const rankIcon = r => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : null
//   const rankCls  = r => 
//     r === 1 ? 'text-accent text-xl font-extrabold' :
//     r === 2 ? 'text-[#bdc3d4] font-bold' :
//     r === 3 ? 'text-[#cd7f32] font-bold' :
//     'text-muted text-sm'

//   return (
//     <div>
//       <div className="flex gap-2 mb-4 flex-wrap">
//         <Sel className="w-auto text-xs py-1.5 px-2.5" value={fSubj} onChange={e=>setFSubj(e.target.value)}>
//           <option value="">— সব বিষয় —</option>
//           {subjects.map(s => (
//             <option key={s._id} value={s._id}>{s.emoji} {s.name}</option>
//           ))}
//         </Sel>
//         <Sel className="w-auto text-xs py-1.5 px-2.5" value={fLvl} onChange={e=>setFLvl(e.target.value)}>
//           <option value="">— সব Level —</option>
//           {levels.map(l => (
//             <option key={l._id} value={l._id}>{l.name}</option>
//           ))}
//         </Sel>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-3 gap-2.5 mb-6">
//         {[
//           { num: stats.total || 0, lbl: 'মোট Participant' },
//           { num: stats.avg ? stats.avg + '%' : '-', lbl: 'গড় নম্বর' },
//           { num: stats.topScore ? `${stats.topScore}/${stats.topFull}` : '-', lbl: 'সর্বোচ্চ' }
//         ].map(s => (
//           <div key={s.lbl} className="bg-card border border-border rounded-2xl p-4 text-center">
//             <div className="font-display font-extrabold text-[1.75rem] text-accent">{s.num}</div>
//             <div className="text-muted text-xs mt-1">{s.lbl}</div>
//           </div>
//         ))}
//       </div>

//       {/* Leaderboard-style Table */}
//       <div className="bg-card border border-border rounded-card overflow-hidden">
//         <div 
//           className="grid text-muted text-xs font-semibold uppercase tracking-wide px-4 py-3 bg-card2 border-b border-border"
//           style={{ gridTemplateColumns: '52px 1fr 140px 140px' }}
//         >
//           <div className="text-center">Rank</div>
//           <div>নাম</div>
//           <div className="text-center">Score</div>
//           <div className="text-right">Finished</div>
//         </div>

//         {loading ? (
//           <div className="py-12 text-center text-muted text-sm animate-pulse">লোড হচ্ছে…</div>
//         ) : results.length === 0 ? (
//           <div className="py-12 text-center text-muted">
//             <div className="text-4xl mb-3">📭</div>
//             এখনো কোনো Result নেই
//           </div>
//         ) : (
//           results.map((p, i) => {
//             const rank = i + 1
//             return (
//               <div
//                 key={p._id || i}
//                 className="grid px-4 py-3.5 border-b border-border last:border-b-0 items-center text-sm hover:bg-accent/4 transition-colors"
//                 style={{ gridTemplateColumns: '52px 1fr 140px 140px' }}
//               >
//                 <div className={`text-center font-display ${rankCls(rank)}`}>
//                   {rankIcon(rank) || `#${rank}`}
//                 </div>

//                 <div>
//                   <div className="font-semibold text-textprimary">
//                     {p.name || 'Unknown Student'}
//                   </div>
//                   {p.school && (
//                     <div className="text-muted text-xs mt-0.5">🏛️ {p.school}</div>
//                   )}
//                 </div>

//                 <div className="text-center">
//                   <span className="px-3 py-1 rounded-full text-xs font-bold bg-green/15 text-green">
//                     {p.score || 0}
//                   </span>
//                 </div>

//                 <div className="text-blue text-xs text-right">
//                   {p.timeStr || p.finishedAt ? new Date(p.finishedAt || p.timeStr).toISOString().slice(0, 10) : '-'}
//                 </div>
//               </div>
//             )
//           })
//         )}
//       </div>

//       <div className="mt-6">
//         <Btn variant="danger" onClick={handleClear}>
//           🗑️ সব Result মুছুন
//         </Btn>
//       </div>
//     </div>
//   )
// }

// ── Results Tab — Leaderboard Style (using examsAPI.overallMerit) ─────────────
// function ResultsTab() {
//   const { subjects, levels, showToast } = useQuiz()
//   const [rows, setRows] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [fSubj, setFSubj] = useState('')
//   const [fLvl, setFLvl] = useState('')

//   // Note: overallMerit currently doesn't support subject/level filter.
//   // If you later add backend support, we can pass params easily.

//   const load = useCallback(async () => {
//     setLoading(true)
//     try {
//       const r = await examsAPI.overallMerit()
//       console.log('Overall Merit Data:', r.data) // for debugging
//       setRows(r.data.rows || [])
//     } catch (err) {
//       showToast('Merit List লোড হয়নি', 'wrong-t')
//       setRows([])
//     }
//     setLoading(false)
//   }, [showToast])

//   useEffect(() => {
//     load()
//   }, [load])

//   const handleClear = async () => {
//     if (!confirm('সব Result মুছে ফেলবো?')) return
//     await resultsAPI.clearAll()   // keep this if you still want to clear old results
//     showToast('🗑️ সব Result মুছে ফেলা হয়েছে', 'wrong-t')
//     load()
//   }

//   // Same helpers as LeaderboardPage
//   const rankIcon = r => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : null
//   const rankCls  = r => 
//     r === 1 ? 'text-accent text-xl font-extrabold' :
//     r === 2 ? 'text-[#bdc3d4] font-bold' :
//     r === 3 ? 'text-[#cd7f32] font-bold' :
//     'text-muted text-sm'

//   return (
//     <div>
//       <div className="flex gap-2 mb-4 flex-wrap">
//         <Sel className="w-auto text-xs py-1.5 px-2.5" value={fSubj} onChange={e => setFSubj(e.target.value)}>
//           <option value="">— সব বিষয় —</option>
//           {subjects.map(s => <option key={s._id} value={s._id}>{s.emoji} {s.name}</option>)}
//         </Sel>
//         <Sel className="w-auto text-xs py-1.5 px-2.5" value={fLvl} onChange={e => setFLvl(e.target.value)}>
//           <option value="">— সব Level —</option>
//           {levels.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
//         </Sel>
//       </div>

//       {/* Stats (simple version - you can enhance later) */}
//       <div className="grid grid-cols-3 gap-2.5 mb-6">
//         <div className="bg-card border border-border rounded-2xl p-4 text-center">
//           <div className="font-display font-extrabold text-[1.75rem] text-accent">{rows.length}</div>
//           <div className="text-muted text-xs mt-1">মোট Participant</div>
//         </div>
//         <div className="bg-card border border-border rounded-2xl p-4 text-center">
//           <div className="font-display font-extrabold text-[1.75rem] text-accent">
//             {rows.length ? Math.max(...rows.map(r => r.totalScore || 0)) : 0}
//           </div>
//           <div className="text-muted text-xs mt-1">সর্বোচ্চ স্কোর</div>
//         </div>
//         <div className="bg-card border border-border rounded-2xl p-4 text-center">
//           <div className="font-display font-extrabold text-[1.75rem] text-accent">
//             {rows.length ? (rows.reduce((sum, r) => sum + (r.totalScore || 0), 0) / rows.length).toFixed(1) : 0}
//           </div>
//           <div className="text-muted text-xs mt-1">গড় স্কোর</div>
//         </div>
//       </div>

//       {/* Leaderboard Table - Exact same style as LeaderboardPage */}
//       <div className="bg-card border border-border rounded-card overflow-hidden">
//         <div 
//           className="grid text-muted text-xs font-semibold uppercase tracking-wide px-4 py-2.5 bg-card2 border-b border-border"
//           style={{ gridTemplateColumns: '52px 1fr 140px 140px' }}
//         >
//           <div className="text-center">Rank</div>
//           <div>নাম</div>
//           <div className="text-center">Total Marks</div>
//           <div className="text-right">Finished Date</div>
//         </div>

//         {loading ? (
//           <div className="py-10 text-center text-muted text-sm animate-pulse">লোড হচ্ছে…</div>
//         ) : rows.length === 0 ? (
//           <div className="py-10 text-center text-muted">
//             <div className="text-4xl mb-2">📭</div>
//             এখনো কোনো on-time exam দেয়া হয়নি
//           </div>
//         ) : (
//           rows.map((p, i) => {
//             const rank = i + 1
//             return (
//               <div
//                 key={p.firebaseUid || i}
//                 className="grid px-4 py-3 border-b border-border last:border-b-0 items-center text-sm transition-colors hover:bg-accent/4"
//                 style={{ gridTemplateColumns: '52px 1fr 140px 140px' }}
//               >
//                 <div className={`text-center font-display ${rankCls(rank)}`}>
//                   {rankIcon(rank) || `#${rank}`}
//                 </div>

//                 <div>
//                   <div className="font-semibold text-textprimary">
//                     {p.playerName || 'User'}
//                   </div>
//                   {p.school && <div className="text-muted text-xs mt-0.5">🏛️ {p.school}</div>}
//                 </div>

//                 <div className="text-center text-xs">
//                   <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green/15 text-green">
//                     {p.totalScore || 0}
//                   </span>
//                 </div>

//                 <div className="text-blue text-xs text-right">
//                   {p.overallFinishedAt ? new Date(p.overallFinishedAt).toISOString().slice(0, 10) : '-'}
//                 </div>
//               </div>
//             )
//           })
//         )}
//       </div>

//       <div className="mt-6">
//         <Btn variant="danger" onClick={handleClear}>
//           🗑️ সব Result মুছুন
//         </Btn>
//       </div>
//     </div>
//   )
// }

function ResultsTab() {
  const { subjects, levels, showToast } = useQuiz()
  const [data,      setData]     = useState({ results:[], stats:{} })
  const [fSubj,     setFSubj]    = useState('')
  const [fLvl,      setFLvl]     = useState('')
  const [loading,   setLoading]  = useState(true)
  const [detail,    setDetail]   = useState(null)   // selected attempt for modal
  const [detailLoading, setDL]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (fSubj) params.subjectId = fSubj
      if (fLvl)  params.levelId   = fLvl
      const r = await resultsAPI.getAll(params)
      setData(r.data)
    } catch { showToast('Results লোড হয়নি','wrong-t') }
    setLoading(false)
  }, [fSubj, fLvl])

  useEffect(() => { load() }, [load])

  const openDetail = async (row) => {
    setDL(true); setDetail({ loading: true, row })
    try {
      const r = await resultsAPI.getDetail(row._id)
      setDetail({ loading: false, row, data: r.data })
    } catch { showToast('Detail লোড হয়নি','wrong-t'); setDetail(null) }
    setDL(false)
  }

  const handleClear = async () => {
    if (!confirm('সব Result মুছে ফেলবো?')) return
    await resultsAPI.clearAll()
    showToast('🗑️ মুছা হয়েছে','wrong-t')
    load()
  }

  const re = ['🥇','🥈','🥉']
  const { results=[], stats={} } = data

  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap">
        <Sel className="w-auto text-xs py-1.5 px-2.5" value={fSubj} onChange={e=>setFSubj(e.target.value)}>
          <option value="">— সব বিষয় —</option>
          {subjects.map(s=><option key={s._id} value={s._id}>{s.emoji} {s.name}</option>)}
        </Sel>
        <Sel className="w-auto text-xs py-1.5 px-2.5" value={fLvl} onChange={e=>setFLvl(e.target.value)}>
          <option value="">— সব Level —</option>
          {levels.map(l=><option key={l._id} value={l._id}>{l.name}</option>)}
        </Sel>
      </div>
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {[{num:stats.total||0,lbl:'মোট Participant'},{num:stats.avg?stats.avg+'%':'-',lbl:'গড় নম্বর'},{num:stats.topScore?`${stats.topScore}/${stats.topFull}`:'-',lbl:'সর্বোচ্চ'}].map(s=>(
          <div key={s.lbl} className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="font-display font-extrabold text-[1.7rem] text-accent">{s.num}</div>
            <div className="text-muted text-xs mt-0.5">{s.lbl}</div>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid text-muted text-xs font-semibold uppercase tracking-wide px-3.5 py-2 bg-card2 border-b border-border" style={{gridTemplateColumns:'30px 1fr 80px 68px 100px 72px 72px'}}>
          <div>#</div><div>নাম</div><div>বিষয়</div><div>Level</div><div>নম্বর</div><div className="text-right">সময়</div><div className="text-right">বিস্তারিত</div>
        </div>
        {loading ? <div className="py-8 text-center text-muted text-sm animate-pulse">লোড হচ্ছে…</div>
        : results.length===0 ? <div className="py-8 text-center text-muted text-sm"><div className="text-3xl mb-2">📭</div>কোনো Result নেই</div>
        : results.map((p,i)=>(
          <div key={p._id} className="grid px-3.5 py-2.5 border-b border-border last:border-0 items-center text-sm hover:bg-accent/3" style={{gridTemplateColumns:'30px 1fr 80px 68px 100px 72px 72px'}}>
            <div className={`font-display font-bold ${i<3?'text-accent':'text-muted'}`}>{i<3?re[i]:i+1}</div>
            <div>
              <div className="font-semibold text-textprimary text-[.88rem]">{p.name}</div>
              {p.school&&<div className="text-muted text-[.72rem]">🏛️ {p.school}</div>}
              {p.examName&&<div className="text-muted text-[.68rem]">📝 {p.examName}</div>}
            </div>
            <div className="text-xs text-muted">{p.subjectEmoji} {p.subjectName}</div>
            <div><span className="text-xs text-purple bg-purple/10 border border-purple/30 px-2 py-0.5 rounded-full">{p.levelShort||p.levelName}</span></div>
            <div><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreCls(p.pct)}`}>{p.score}/{p.fullMarks} ({p.pct}%)</span></div>
            <div className="text-blue text-xs text-right">{p.timeStr}</div>
            <div className="text-right"><Btn variant="blue" onClick={()=>openDetail(p)}>🔍 Details</Btn></div>
          </div>
        ))}
      </div>
      <div className="mt-3"><Btn variant="danger" onClick={handleClear}>🗑️ সব Result মুছুন</Btn></div>

      {/* Detail Modal */}
      <Modal open={!!detail} onClose={()=>setDetail(null)} title="📋 বিস্তারিত ফলাফল">
        {detail?.loading && <div className="py-8 text-center text-muted animate-pulse">লোড হচ্ছে…</div>}
        {detail?.data && (() => {
          const d = detail.data
          return (
            <div className="text-sm">
              <div className="flex items-center gap-3 mb-4 p-3 bg-card2 rounded-xl border border-border">
                <div className="text-3xl">👤</div>
                <div>
                  <div className="font-display font-bold text-base">{d.playerName}</div>
                  {d.school && <div className="text-muted text-xs">🏛️ {d.school}</div>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  ['📝 Exam',    d.examName],
                  ['📚 বিষয়',   `${d.subjectId?.emoji||''} ${d.subjectId?.name||''}`],
                  ['🏫 Level',   d.levelId?.name||''],
                  ['🎯 নম্বর',   `${d.score}/${d.fullMarks} (${d.pct}%)`],
                  ['✅ সঠিক',    d.correct],
                  ['❌ ভুল',     d.wrong],
                  ['⏭️ Skip',    d.skip],
                  ['⏱️ সময়',    d.timeStr],
                ].map(([l,v])=>(
                  <div key={l} className="bg-card2 border border-border rounded-xl p-2.5">
                    <div className="text-muted text-[.68rem] mb-0.5">{l}</div>
                    <div className="font-bold text-textprimary text-xs">{v}</div>
                  </div>
                ))}
              </div>
              <div className="text-muted text-[.7rem] text-center">
                শুরু: {new Date(d.startedAt).toLocaleString('bn-BD')} · 
                শেষ: {new Date(d.submittedAt).toLocaleString('bn-BD')}
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}

// ── Subjects Tab ──────────────────────────────────────────────────────────────
function SubjectsTab() {
  const { subjects, refreshSubjects, showToast } = useQuiz()
  const [open,setOpen]=useState(false)
  const [editId,setEditId]=useState(null)
  const [form,setForm]=useState({name:'',emoji:'🧮',color:'#f7c948'})
  const [err,setErr]=useState('')

  const openNew  = ()  => { setEditId(null); setForm({name:'',emoji:'🧮',color:'#f7c948'}); setErr(''); setOpen(true) }
  const openEdit = (s) => { setEditId(s._id); setForm({name:s.name,emoji:s.emoji,color:s.color}); setErr(''); setOpen(true) }

  const handleSave = async () => {
    if (!form.name.trim()) { setErr('⚠️ নাম লিখুন!'); return }
    try {
      if (editId) { await subjectsAPI.update(editId, form); showToast('✅ আপডেট!','correct-t') }
      else        { await subjectsAPI.create(form);          showToast('✅ যোগ হয়েছে!','correct-t') }
      await refreshSubjects(); setOpen(false)
    } catch { setErr('❌ সংরক্ষণ হয়নি') }
  }
  const handleDel = async (s) => {
    if (!confirm(`"${s.name}" ও এর সব প্রশ্ন মুছবো?`)) return
    await subjectsAPI.remove(s._id); showToast('🗑️ মুছা হয়েছে','wrong-t'); refreshSubjects()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="font-display font-bold text-sm">বিষয় তালিকা</span>
        <Btn variant="green" onClick={openNew}>+ নতুন বিষয়</Btn>
      </div>
      {subjects.length===0
        ? <div className="py-8 text-center text-muted text-sm"><div className="text-3xl mb-2">📂</div>কোনো বিষয় নেই।</div>
        : <div className="flex flex-col gap-2">
          {subjects.map(s=>(
            <div key={s._id} className="bg-card border border-border rounded-xl px-3.5 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{s.emoji}</span>
                <div><div className="font-display font-bold text-sm" style={{color:s.color}}>{s.name}</div></div>
              </div>
              <div className="flex gap-1.5">
                <Btn variant="blue" onClick={()=>openEdit(s)}>✏️</Btn>
                <Btn variant="danger" onClick={()=>handleDel(s)}>🗑️</Btn>
              </div>
            </div>
          ))}
        </div>
      }
      <Modal open={open} onClose={()=>setOpen(false)} title={editId?'বিষয় সম্পাদনা':'নতুন বিষয়'} size="sm">
        <Row label="বিষয়ের নাম *"><Inp value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="যেমন: গণিত"/></Row>
        <Row label="Emoji">
          <div className="flex flex-wrap gap-1.5">
            {EMOJIS.map(e=><button key={e} onClick={()=>setForm(f=>({...f,emoji:e}))} className={`text-2xl px-2 py-1 rounded-lg border-2 transition ${form.emoji===e?'border-accent bg-accent/10':'border-transparent hover:border-accent/50'}`}>{e}</button>)}
          </div>
        </Row>
        <Row label="রঙ">
          <Sel value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))}>
            {[['#f7c948','🟡 হলুদ'],['#38b2f5','🔵 নীল'],['#43e97b','🟢 সবুজ'],['#ff6b6b','🔴 লাল'],['#a78bfa','🟣 বেগুনি'],['#fb923c','🟠 কমলা'],['#ec4899','🩷 গোলাপি']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </Sel>
        </Row>
        {err&&<p className="text-accent2 text-xs mb-2 text-center">{err}</p>}
        <div className="flex gap-2 mt-4">
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl font-display font-bold text-sm text-[#1a1200]" style={{background:'linear-gradient(135deg,var(--accent),#ff9f43)'}}>💾 সংরক্ষণ</button>
          <button onClick={()=>setOpen(false)} className="flex-1 py-2.5 rounded-xl font-display font-semibold text-sm text-muted border border-border">বাতিল</button>
        </div>
      </Modal>
    </div>
  )
}

// ── Levels Tab ────────────────────────────────────────────────────────────────
function LevelsTab() {
  const { levels, refreshLevels, showToast } = useQuiz()
  const [open,setOpen]=useState(false)
  const [editId,setEditId]=useState(null)
  const [form,setForm]=useState({name:'',short:''})
  const [err,setErr]=useState('')

  const openNew  = ()  => { setEditId(null); setForm({name:'',short:''}); setErr(''); setOpen(true) }
  const openEdit = (l) => { setEditId(l._id); setForm({name:l.name,short:l.short||''}); setErr(''); setOpen(true) }

  const handleSave = async () => {
    if (!form.name.trim()) { setErr('⚠️ নাম লিখুন!'); return }
    try {
      if (editId) { await levelsAPI.update(editId, form); showToast('✅ আপডেট!','correct-t') }
      else        { await levelsAPI.create(form);          showToast('✅ যোগ হয়েছে!','correct-t') }
      await refreshLevels(); setOpen(false)
    } catch { setErr('❌ সংরক্ষণ হয়নি') }
  }
  const handleDel = async (l) => {
    if (!confirm(`"${l.name}" ও এর সব প্রশ্ন মুছবো?`)) return
    await levelsAPI.remove(l._id); showToast('🗑️ মুছা হয়েছে','wrong-t'); refreshLevels()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="font-display font-bold text-sm">Level তালিকা</span>
        <Btn variant="green" onClick={openNew}>+ নতুন Level</Btn>
      </div>
      {levels.length===0
        ? <div className="py-8 text-center text-muted text-sm"><div className="text-3xl mb-2">🏫</div>কোনো Level নেই।</div>
        : <div className="flex flex-col gap-2">
          {levels.map(l=>(
            <div key={l._id} className="bg-card border border-border rounded-xl px-3.5 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="font-display font-bold text-sm px-3 py-1 rounded-full bg-purple/12 text-purple border border-purple/30">{l.short||l.name}</span>
                <div><div className="font-semibold text-sm">{l.name}</div></div>
              </div>
              <div className="flex gap-1.5">
                <Btn variant="blue" onClick={()=>openEdit(l)}>✏️</Btn>
                <Btn variant="danger" onClick={()=>handleDel(l)}>🗑️</Btn>
              </div>
            </div>
          ))}
        </div>
      }
      <Modal open={open} onClose={()=>setOpen(false)} title={editId?'Level সম্পাদনা':'নতুন Level'} size="sm">
        <Row label="Level নাম *"><Inp value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="যেমন: Class 9-10"/></Row>
        <Row label="সংক্ষিপ্ত (badge)"><Inp value={form.short} onChange={e=>setForm(f=>({...f,short:e.target.value}))} placeholder="যেমন: SSC" maxLength={8}/></Row>
        {err&&<p className="text-accent2 text-xs mb-2">{err}</p>}
        <div className="flex gap-2 mt-4">
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl font-display font-bold text-sm text-[#1a1200]" style={{background:'linear-gradient(135deg,var(--accent),#ff9f43)'}}>💾 সংরক্ষণ</button>
          <button onClick={()=>setOpen(false)} className="flex-1 py-2.5 rounded-xl font-display font-semibold text-sm text-muted border border-border">বাতিল</button>
        </div>
      </Modal>
    </div>
  )
}

// ── Questions Tab ─────────────────────────────────────────────────────────────
// function QuestionsTab() {
//   const { subjects, levels, showToast } = useQuiz()
//   const [qs,     setQs]     = useState([])
//   const [fSubj,  setFSubj]  = useState('')
//   const [fLvl,   setFLvl]   = useState('')
//   const [loading,setLoading]= useState(false)
//   const [open,   setOpen]   = useState(false)
//   const [editId, setEditId] = useState(null)
//   const [form,   setForm]   = useState({})
//   const [tags,   setTags]   = useState([])
//   const [tagInp, setTagInp] = useState('')
//   const [imgPrev,setImgPrev]= useState('')
//   const [err,    setErr]    = useState('')
//   const fileRef = useRef()

//   const load = useCallback(async () => {
//     setLoading(true)
//     const params = {}
//     if (fSubj) params.subjectId = fSubj
//     if (fLvl)  params.levelId   = fLvl
//     try { const r = await questionsAPI.browse(params); setQs(r.data) } catch {}
//     setLoading(false)
//   }, [fSubj, fLvl])

//   useEffect(() => { load() }, [load])

//   // setForm({subjectId:subjects[0]?._id||'',levelId:levels[0]?._id||'',examName:'',publishAt:'',difficulty:'medium',q:'',opts:['','','',''],ans:-1,marks:1,context:'',image:'',explanation:''})

//   // examName:q.examName||'',publishAt:toDatetimeLocalValue(q.publishDate)||''

//   const openNew = () => { setEditId(null); setForm({ subjectId: subjects[0]?._id || '', levelId: levels[0]?._id || '', examName: '', publishDate: '', q: '', opts: ['', '', '', ''], ans: -1, marks: 1, context: '', image: '', explanation: '' }); setTags([]); setImgPrev(''); setErr(''); setOpen(true) }
  
//   const openEdit = q => { setEditId(q._id); setForm({subjectId:q.subjectId,levelId:q.levelId,examName: q.examName||'', publishDate: q.publishDate ? q.publishDate.slice(0,10) : '',difficulty:q.difficulty||'medium',q:q.q,opts:[...q.opts],ans:q.ans,marks:q.marks||1,context:q.context||'',image:q.image||'',explanation:q.explanation||''}); setTags(q.tags||[]); setImgPrev(q.image||''); setErr(''); setOpen(true) }

//   const handleSave = async () => {
//     // if (!form.examName?.trim())            { setErr('⚠️ Exam Name লিখুন!'); return }
//     // if (!form.publishAt?.trim()) { setErr('⚠️ প্রকাশের সময় নির্বাচন করুন!'); return }
//     if (!form.examName?.trim()) { setErr('⚠️ Exam Name লিখুন!'); return }
//     if (!form.publishDate)       { setErr('⚠️ Publish Date দিন!'); return }
//     const publishDate = new Date(form.publishDate)
//     if (Number.isNaN(publishDate.getTime())) { setErr('⚠️ প্রকাশের সময় সঠিক নয়'); return }
//     if (!form.q?.trim())                  { setErr('⚠️ প্রশ্ন লিখুন!'); return }
//     if (form.opts.some(o=>!o?.trim()))    { setErr('⚠️ সব বিকল্প লিখুন!'); return }
//     if (form.ans<0||form.ans>3)           { setErr('⚠️ সঠিক উত্তর select করুন!'); return }
//     const payload = {
//       subjectId: form.subjectId,
//       levelId: form.levelId,
//       examName: form.examName.trim(),
//       publishDate: publishDate.toISOString(),
//       difficulty: form.difficulty || 'medium',
//       q: form.q,
//       opts: form.opts,
//       ans: form.ans,
//       marks: parseInt(form.marks, 10) || 1,
//       tags: tags.length ? [...tags] : [],
//       context: form.context || '',
//       explanation: form.explanation || '',
//       image: form.image || '',
//     }
//     if (!payload.context)     delete payload.context
//     if (!payload.image)       delete payload.image
//     if (!payload.explanation) delete payload.explanation
//     try {
//       if (editId) {
//         await questionsAPI.update(editId, {
//           subjectId: payload.subjectId,
//           levelId: payload.levelId,
//           examName: payload.examName,
//           publishDate: payload.publishDate,
//           difficulty: payload.difficulty,
//           q: payload.q,
//           opts: payload.opts,
//           ans: payload.ans,
//           marks: payload.marks,
//           tags: payload.tags,
//           context: payload.context,
//           explanation: payload.explanation,
//           image: payload.image,
//         })
//         showToast('✅ আপডেট!','correct-t')
//       } else {
//         await questionsAPI.create(payload)
//         showToast('✅ যোগ হয়েছে!','correct-t')
//       }
//       setOpen(false); load()
//     } catch { setErr('❌ সংরক্ষণ হয়নি') }
//   }

//   const handleDel = async (id) => {
//     if (!confirm('মুছবো?')) return
//     await questionsAPI.remove(id); showToast('🗑️ মুছা হয়েছে','wrong-t'); load()
//   }

//   const handleTagKey = e => {
//     if ((e.key==='Enter'||e.key===',')&&tagInp.trim()) {
//       e.preventDefault()
//       const val = tagInp.trim().replace(/,/g,'')
//       if (!tags.includes(val)) setTags([...tags,val])
//       setTagInp('')
//     } else if (e.key==='Backspace'&&!tagInp&&tags.length) { setTags(tags.slice(0,-1)) }
//   }

//   const handleImgFile = file => {
//     if (!file) return
//     if (file.size>2*1024*1024) { showToast('⚠️ সর্বোচ্চ ২MB','wrong-t'); return }
//     const r = new FileReader(); r.onload = e => { setForm(f=>({...f,image:e.target.result})); setImgPrev(e.target.result) }; r.readAsDataURL(file)
//   }

//   const handleExport = async () => {
//     const params = {}
//     if (fSubj) params.subjectId = fSubj
//     if (fLvl)  params.levelId   = fLvl
//     const r = await questionsAPI.export(params)
//     const blob = new Blob([JSON.stringify(r.data,null,2)],{type:'application/json'})
//     const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`questions_${Date.now()}.json`; a.click()
//     showToast(`✅ ${r.data.length}টি export হয়েছে!`,'correct-t')
//   }

//   return (
//     <div>
//       <div className="flex flex-wrap gap-2 items-center mb-3">
//         <Sel className="w-auto text-xs py-1.5 px-2.5" value={fSubj} onChange={e=>setFSubj(e.target.value)}>
//           <option value="">— সব বিষয় —</option>
//           {subjects.map(s=><option key={s._id} value={s._id}>{s.emoji} {s.name}</option>)}
//         </Sel>
//         <Sel className="w-auto text-xs py-1.5 px-2.5" value={fLvl} onChange={e=>setFLvl(e.target.value)}>
//           <option value="">— সব Level —</option>
//           {levels.map(l=><option key={l._id} value={l._id}>{l.name}</option>)}
//         </Sel>
//         <span className="text-xs text-muted bg-card2 border border-border rounded-lg px-2.5 py-1">{qs.length} টি</span>
//         <Btn variant="green" onClick={openNew}>+ নতুন প্রশ্ন</Btn>
//         <Btn variant="purple" onClick={handleExport}>⬇️ Export JSON</Btn>
//       </div>

//       <div className="flex flex-col gap-2 max-h-[430px] overflow-y-auto">
//         {loading ? <div className="py-8 text-center text-muted text-sm animate-pulse">লোড হচ্ছে…</div>
//         : qs.length===0 ? <div className="py-8 text-center text-muted text-sm"><div className="text-3xl mb-2">📝</div>কোনো প্রশ্ন নেই।</div>
//         : qs.map((q,i)=>{
//           const s=subjects.find(x=>x._id===q.subjectId), l=levels.find(x=>x._id===q.levelId)
//           return(
//             <div key={q._id} className="bg-card border border-border rounded-xl px-3.5 py-3">
//               <div className="flex justify-between gap-2 mb-1">
//                 <div className="text-sm flex-1 leading-snug">{q.q}</div>
//                 <div className="flex flex-col items-end gap-1 flex-shrink-0">
//                   <span className="text-muted text-[.72rem]">#{i+1}</span>
//                   {q.examName && <span className="text-[.65rem] px-1.5 py-0.5 rounded-lg bg-blue/10 text-blue border border-blue/25 max-w-[140px] truncate" title={q.examName}>{q.examName}</span>}
//                   {q.difficulty && <span className="text-[.62rem] uppercase tracking-wide text-muted">{q.difficulty}</span>}
//                   {s&&<span className="text-xs px-1.5 py-0.5 rounded-lg" style={{color:s.color,background:`${s.color}15`}}>{s.emoji} {s.name}</span>}
//                   {l&&<span className="text-xs text-purple bg-purple/10 border border-purple/30 px-1.5 py-0.5 rounded-full">{l.short||l.name}</span>}
//                 </div>
//               </div>
//               {q.tags?.length>0&&<div className="flex flex-wrap gap-1 mb-1">{q.tags.map(t=><span key={t} className="text-[.68rem] px-1.5 py-0.5 rounded-full bg-purple/10 border border-purple/30 text-purple">#{t}</span>)}</div>}
//               <div className="flex flex-wrap gap-1 mb-2">
//                 {q.opts.map((o,oi)=><span key={oi} className={`text-xs px-2 py-0.5 rounded-md border ${oi===q.ans?'border-green text-green bg-green/8':'border-border text-muted'}`}>{LETTERS[oi]}) {o}</span>)}
//               </div>
//               <div className="flex gap-1.5">
//                 <Btn variant="blue" onClick={()=>openEdit(q)}>✏️ সম্পাদনা</Btn>
//                 <Btn variant="danger" onClick={()=>handleDel(q._id)}>🗑️ মুছুন</Btn>
//               </div>
//             </div>
//           )
//         })}
//       </div>

//       <Modal open={open} onClose={()=>setOpen(false)} title={editId?'প্রশ্ন সম্পাদনা':'নতুন প্রশ্ন'}>
//         <div className="grid grid-cols-2 gap-2.5">
//           <Row label="বিষয় *"><Sel value={form.subjectId||''} onChange={e=>setForm(f=>({...f,subjectId:e.target.value}))}>{subjects.map(s=><option key={s._id} value={s._id}>{s.emoji} {s.name}</option>)}</Sel></Row>
//           <Row label="Level (ক্লাস) *"><Sel value={form.levelId||''} onChange={e=>setForm(f=>({...f,levelId:e.target.value}))}>{levels.map(l=><option key={l._id} value={l._id}>{l.name}</option>)}</Sel></Row>
//         </div>
//         {/* <Row label="Exam Name *"><Inp value={form.examName||''} onChange={e=>setForm(f=>({...f,examName:e.target.value}))} placeholder="যেমন: গণিত মডেল টেস্ট-১" maxLength={120}/></Row> */}
//         <div className="grid grid-cols-2 gap-2.5">
//   <Row label="Exam Name *">
//     <Inp value={form.examName||''} onChange={e=>setForm(f=>({...f,examName:e.target.value}))} placeholder="যেমন: গণিত Model Test-1"/>
//   </Row>
//   <Row label="Publish Date *">
//     <Inp type="date" value={form.publishDate||''} onChange={e=>setForm(f=>({...f,publishDate:e.target.value}))}/>
//   </Row>
// </div>
//         {/* <div className="grid grid-cols-2 gap-2.5">
//           <Row label="প্রকাশের তারিখ ও সময় *"><Inp type="datetime-local" value={form.publishAt||''} onChange={e=>setForm(f=>({...f,publishAt:e.target.value}))}/></Row>
//           <Row label="স্তর (difficulty) *">
//             <Sel value={form.difficulty||'medium'} onChange={e=>setForm(f=>({...f,difficulty:e.target.value}))}>
//               <option value="easy">সহজ · Easy</option>
//               <option value="medium">মাঝারি · Medium</option>
//               <option value="hard">কঠিন · Hard</option>
//             </Sel>
//           </Row>
//         </div> */}
//         <div className="grid grid-cols-2 gap-2.5">
//           <Row label="নম্বর *"><Inp type="number" min={1} max={20} value={form.marks||1} onChange={e=>setForm(f=>({...f,marks:e.target.value}))}/></Row>
//           <Row label="Tags (Enter)">
//             <div className="flex flex-wrap gap-1 bg-card2 border-[1.5px] border-border rounded-xl px-2.5 py-1.5 min-h-[40px] items-center focus-within:border-accent cursor-text" onClick={()=>document.getElementById('qTagI').focus()}>
//               {tags.map((t,i)=><span key={i} className="tag-chip">{t}<span className="ml-1 cursor-pointer opacity-70 hover:text-accent2" onClick={()=>setTags(tags.filter((_,j)=>j!==i))}>×</span></span>)}
//               <input id="qTagI" className="border-none bg-transparent outline-none text-textprimary text-xs font-body min-w-[80px] flex-1" placeholder="tag..." value={tagInp} onChange={e=>setTagInp(e.target.value)} onKeyDown={handleTagKey}/>
//             </div>
//           </Row>
//         </div>
//         <Row label="Context"><Inp value={form.context||''} onChange={e=>setForm(f=>({...f,context:e.target.value}))} placeholder="ঐচ্ছিক context"/></Row>
//         <Row label="🖼️ Image">
//           <div className="flex gap-2 items-center">
//             <Inp type="url" placeholder="https://... URL" value={form.image&&!form.image.startsWith('data:')?form.image:''} onChange={e=>{setForm(f=>({...f,image:e.target.value}));setImgPrev(e.target.value)}}/>
//             <label className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-display font-bold text-xs text-white cursor-pointer" style={{background:'linear-gradient(135deg,#38b2f5,#6c63ff)'}}>
//               📁<input type="file" className="hidden" accept="image/*" ref={fileRef} onChange={e=>handleImgFile(e.target.files[0])}/>
//             </label>
//           </div>
//           {imgPrev&&<div className="mt-2 relative inline-block"><img src={imgPrev} alt="" className="max-h-[120px] rounded-lg border border-border object-contain" onError={()=>setImgPrev('')}/><button onClick={()=>{setImgPrev('');setForm(f=>({...f,image:''}))}} className="absolute top-1 right-1 bg-accent2/90 rounded-full w-5 h-5 text-white text-xs flex items-center justify-center">✕</button></div>}
//         </Row>
//         <Row label="প্রশ্ন *"><textarea className="w-full bg-card2 border-[1.5px] border-border rounded-xl px-3.5 py-2.5 text-textprimary font-body text-sm outline-none transition focus:border-accent placeholder-muted resize-y min-h-[72px]" placeholder="প্রশ্নটি লিখুন..." value={form.q||''} onChange={e=>setForm(f=>({...f,q:e.target.value}))}/></Row>
//         <div className="text-muted text-xs mb-2">সঠিক বিকল্পের পাশের বৃত্ত ✅</div>
//         {[0,1,2,3].map(i=>(
//           <div key={i} className="flex items-center gap-2 mb-2">
//             <span className="w-6 h-6 rounded-full bg-border flex items-center justify-center font-bold text-xs flex-shrink-0 text-muted">{LETTERS[i]}</span>
//             <input className="flex-1 bg-card2 border-[1.5px] border-border rounded-xl px-3 py-2 text-textprimary font-body text-sm outline-none transition focus:border-accent" placeholder={`বিকল্প ${LETTERS[i]}`} value={form.opts?.[i]||''} onChange={e=>{const o=[...(form.opts||['','','',''])];o[i]=e.target.value;setForm(f=>({...f,opts:o}))}}/>
//             <input type="radio" name="ansRadio" value={i} className="w-5 h-5 accent-green cursor-pointer" checked={form.ans===i} onChange={()=>setForm(f=>({...f,ans:i}))}/>
//           </div>
//         ))}
//         <Row label="💡 Explanation"><textarea className="w-full bg-card2 border-[1.5px] border-border rounded-xl px-3.5 py-2.5 text-textprimary font-body text-sm outline-none transition focus:border-accent resize-y min-h-[56px]" placeholder="ব্যাখ্যা..." value={form.explanation||''} onChange={e=>setForm(f=>({...f,explanation:e.target.value}))}/></Row>
//         {err&&<p className="text-accent2 text-xs mb-2 text-center">{err}</p>}
//         <div className="flex gap-2 mt-4">
//           <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl font-display font-bold text-sm text-[#1a1200]" style={{background:'linear-gradient(135deg,var(--accent),#ff9f43)'}}>💾 সংরক্ষণ</button>
//           <button onClick={()=>setOpen(false)} className="flex-1 py-2.5 rounded-xl font-display font-semibold text-sm text-muted border border-border">বাতিল</button>
//         </div>
//       </Modal>
//     </div>
//   )
// }
function QuestionsTab() {
  const { subjects, levels, showToast } = useQuiz()

  // ── Phase 1: Exam config (filled once) ──
  const [config, setConfig] = useState(null)  // null = not yet configured
  const [configForm, setConfigForm] = useState({
    subjectId: '', levelId: '', examName: '', publishDate: '', totalMarks: 10,
  })
  const [configErr, setConfigErr] = useState('')

  // ── Phase 2: Question slots ──
  const [slots, setSlots] = useState([])  // array of question drafts
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const handleConfigSubmit = () => {
    const { subjectId, levelId, examName, publishDate, totalMarks } = configForm
    if (!subjectId)          return setConfigErr('⚠️ বিষয় নির্বাচন করুন')
    if (!levelId)            return setConfigErr('⚠️ Level নির্বাচন করুন')
    if (!examName.trim())    return setConfigErr('⚠️ Exam Name লিখুন')
    if (!publishDate)        return setConfigErr('⚠️ Publish Date দিন')
    if (!totalMarks || totalMarks < 1) return setConfigErr('⚠️ Total Marks দিন')
    setConfigErr('')
    setConfig({ ...configForm, totalMarks: parseInt(totalMarks) })
    // Create empty slots
    setSlots(Array.from({ length: parseInt(totalMarks) }, () => ({
      q: '', opts: ['', '', '', ''], ans: -1, marks: 1, image: '', explanation: '', context: '',
    })))
    setSaveMsg('')
  }

  const updateSlot = (i, field, value) => {
    setSlots(prev => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })
  }
  const updateSlotOpt = (i, oi, value) => {
    setSlots(prev => {
      const next = [...prev]
      const opts = [...next[i].opts]; opts[oi] = value
      next[i] = { ...next[i], opts }
      return next
    })
  }

  const handleSaveAll = async () => {
    // Validate all slots
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i]
      if (!s.q.trim())                        return showToast(`⚠️ প্রশ্ন ${i+1}: প্রশ্ন লিখুন`, 'wrong-t')
      if (s.opts.some(o => !o.trim()))         return showToast(`⚠️ প্রশ্ন ${i+1}: সব বিকল্প লিখুন`, 'wrong-t')
      if (s.ans < 0 || s.ans > 3)             return showToast(`⚠️ প্রশ্ন ${i+1}: সঠিক উত্তর select করুন`, 'wrong-t')
    }
    setSaving(true); setSaveMsg('')
    try {
      const { subjectId, levelId, examName, publishDate, publishTime } = config
      // const publishDateTime = `${publishDate}T${publishTime || '00:00'}:00`
      // const publishDateTime = new Date(`${publishDate}T${publishTime || '00:00'}:00`).toISOString();
      // const localDate = new Date(`${publishDate}T${publishTime || '00:00'}:00`)
      // const publishDateTime = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000).toISOString()
      const publishDateTime = new Date(publishDate).toISOString()
      const res = await adminExamsAPI.create({
        subjectId, levelId, examName,
        publishDate: publishDateTime,
        questions: slots,
      })
      setSaveMsg(`✅ "${examName}" — ${res.data.inserted}টি প্রশ্ন সংরক্ষিত!`)
      showToast(`✅ ${res.data.inserted}টি import হয়েছে!`, 'correct-t')
      // Reset everything
      setConfig(null)
      setSlots([])
      setConfigForm({ subjectId:'', levelId:'', examName:'', publishDate:'', publishTime:'00:00', totalMarks:10 })
    } catch (err) {
      setSaveMsg('❌ সংরক্ষণ হয়নি: ' + (err.response?.data?.error || err.message))
    }
    setSaving(false)
  }

  // ── Phase 1 UI ──
  if (!config) {
    return (
      <div>
        <div className="font-display font-bold text-sm mb-1">📝 নতুন Exam তৈরি করুন</div>
        <p className="text-muted text-xs mb-4">একবার config করুন, তারপর প্রশ্নগুলো একে একে লিখুন।</p>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="grid grid-cols-2 gap-3">
            <Row label="বিষয় *">
              <Sel value={configForm.subjectId} onChange={e=>setConfigForm(f=>({...f,subjectId:e.target.value}))}>
                <option value="">— বিষয় —</option>
                {subjects.map(s=><option key={s._id} value={s._id}>{s.emoji} {s.name}</option>)}
              </Sel>
            </Row>
            <Row label="Level *">
              <Sel value={configForm.levelId} onChange={e=>setConfigForm(f=>({...f,levelId:e.target.value}))}>
                <option value="">— Level —</option>
                {levels.map(l=><option key={l._id} value={l._id}>{l.name}</option>)}
              </Sel>
            </Row>
            <Row label="Exam Name *">
              <Inp value={configForm.examName} onChange={e=>setConfigForm(f=>({...f,examName:e.target.value}))} placeholder="যেমন: গণিত Model Test-1" maxLength={80}/>
            </Row>
            <Row label="Total Marks *">
              <Inp type="number" min={1} max={200} value={configForm.totalMarks} onChange={e=>setConfigForm(f=>({...f,totalMarks:e.target.value}))} placeholder="যেমন: 30"/>
            </Row>
            <Row label="Publish Date *">
              <Inp type="date" value={configForm.publishDate} onChange={e=>setConfigForm(f=>({...f,publishDate:e.target.value}))}/>
            </Row>
            {/* <Row label="Publish Time">
              <Inp type="time" value={configForm.publishTime} onChange={e=>setConfigForm(f=>({...f,publishTime:e.target.value}))}/>
            </Row> */}
          </div>
          {configErr && <p className="text-accent2 text-xs mt-2 text-center">{configErr}</p>}
          <button onClick={handleConfigSubmit}
            className="mt-4 w-full py-3 rounded-xl font-display font-bold text-sm text-[#1a1200] transition hover:-translate-y-0.5"
            style={{background:'linear-gradient(135deg,var(--accent),#ff9f43)'}}>
            ➡️ পরবর্তী: প্রশ্ন লিখুন ({configForm.totalMarks || '?'}টি)
          </button>
        </div>
      </div>
    )
  }

  // ── Phase 2 UI ──
  const subj = subjects.find(s => s._id === config.subjectId)
  const lvl  = levels.find(l => l._id === config.levelId)

  return (
    <div>
      {/* Config summary banner */}
      <div className="bg-card2 border border-border rounded-xl px-3.5 py-2.5 mb-4 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2 text-xs">
          {subj && <span className="px-2 py-1 rounded-lg font-bold" style={{color:subj.color,background:`${subj.color}18`}}>{subj.emoji} {subj.name}</span>}
          {lvl  && <span className="px-2 py-1 rounded-full text-purple bg-purple/10 border border-purple/30">{lvl.name}</span>}
          <span className="text-textprimary font-bold">📝 {config.examName}</span>
          <span className="text-muted">📅 {config.publishDate}</span>
          <span className="text-muted">🎯 {config.totalMarks} marks</span>
        </div>
        <Btn variant="outline" onClick={()=>{setConfig(null);setSlots([])}}>✏️ Edit Config</Btn>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted">{slots.filter(s=>s.q.trim()&&s.ans>=0).length} / {slots.length} টি সম্পূর্ণ</span>
        <Btn variant="green" onClick={handleSaveAll} disabled={saving}>
          {saving ? '⏳ সংরক্ষণ হচ্ছে…' : `💾 সব ${slots.length}টি প্রশ্ন সংরক্ষণ করুন`}
        </Btn>
      </div>

      {saveMsg && <p className={`text-xs mb-3 text-center font-bold ${saveMsg.startsWith('✅')?'text-green':'text-accent2'}`}>{saveMsg}</p>}

      {/* Question slots */}
      <div className="flex flex-col gap-4">
        {slots.map((slot, i) => {
          const done = slot.q.trim() && slot.ans >= 0 && slot.opts.every(o=>o.trim())
          return (
            <div key={i} className={`bg-card border rounded-xl p-4 transition ${done?'border-green/40':'border-border'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`font-display font-bold text-xs px-2 py-0.5 rounded-full ${done?'bg-green/10 text-green':'bg-card2 text-muted'}`}>
                  প্রশ্ন {i+1} {done?'✅':''}
                </span>
              </div>
              <textarea
                className="w-full bg-card2 border-[1.5px] border-border rounded-xl px-3.5 py-2.5 text-textprimary font-body text-sm outline-none focus:border-accent resize-y min-h-[72px] mb-3"
                placeholder={`প্রশ্ন ${i+1} লিখুন…`}
                value={slot.q}
                onChange={e=>updateSlot(i,'q',e.target.value)}
              />
              <div className="text-muted text-xs mb-2">সঠিক বিকল্পের পাশের বৃত্ত ✅</div>
              {[0,1,2,3].map(oi=>(
                <div key={oi} className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-border flex items-center justify-center font-bold text-xs flex-shrink-0 text-muted">{LETTERS[oi]}</span>
                  <input
                    className="flex-1 bg-card2 border-[1.5px] border-border rounded-xl px-3 py-2 text-textprimary font-body text-sm outline-none focus:border-accent"
                    placeholder={`বিকল্প ${LETTERS[oi]}`}
                    value={slot.opts[oi]}
                    onChange={e=>updateSlotOpt(i,oi,e.target.value)}
                  />
                  <input type="radio" name={`ans_${i}`} className="w-5 h-5 accent-green cursor-pointer" checked={slot.ans===oi} onChange={()=>updateSlot(i,'ans',oi)}/>
                </div>
              ))}
              {/* Optional fields toggle */}
              <details className="mt-1">
                <summary className="text-muted text-xs cursor-pointer select-none hover:text-accent">+ Explanation / Image (ঐচ্ছিক)</summary>
                <div className="mt-2 space-y-2">
                  <Inp placeholder="💡 Explanation…" value={slot.explanation} onChange={e=>updateSlot(i,'explanation',e.target.value)}/>
                  <Inp placeholder="🖼️ Image URL…" value={slot.image} onChange={e=>updateSlot(i,'image',e.target.value)}/>
                </div>
              </details>
            </div>
          )
        })}
      </div>

      {slots.length > 3 && (
        <button onClick={handleSaveAll} disabled={saving}
          className="mt-4 w-full py-3 rounded-xl font-display font-bold text-sm text-[#1a1200] transition hover:-translate-y-0.5 disabled:opacity-50"
          style={{background:'linear-gradient(135deg,var(--accent),#ff9f43)'}}>
          {saving ? '⏳…' : `💾 সব ${slots.length}টি প্রশ্ন সংরক্ষণ করুন`}
        </button>
      )}
    </div>
  )
}

// ── PDF Upload Tab — THE KEY NEW FEATURE ─────────────────────────────────────
function PdfTab() {
  const { subjects, levels, showToast } = useQuiz()
  const [file,       setFile]       = useState(null)
  const [subjId,     setSubjId]     = useState('')
  const [lvlId,      setLvlId]      = useState('')
  const [examName,   setExamName]   = useState('')
  const [publishDate,  setPublishDate]  = useState('')
  const [pdfRef,     setPdfRef]     = useState('')
  const [parsing,    setParsing]    = useState(false)
  const [parsed,     setParsed]     = useState(null)   // extracted questions
  const [saving,     setSaving]     = useState(false)
  const [editIdx,    setEditIdx]    = useState(null)   // index being edited
  const [editForm,   setEditForm]   = useState({})
  const [parseErr,   setParseErr]   = useState('')
  const [saveMsg,    setSaveMsg]    = useState('')
  const dropRef = useRef()

  // Trigger parse
  const handleParse = async () => {
    if (!file)     { setParseErr('PDF ফাইল select করুন'); return }
    if (!subjId)   { setParseErr('বিষয় select করুন'); return }
    if (!lvlId)    { setParseErr('Level select করুন'); return }
    if (!examName.trim()) { setParseErr('Exam Name লিখুন'); return }
    if (!publishDate?.trim()) { setParseErr('প্রকাশের তারিখ নির্বাচন করুন'); return }
    // if (Number.isNaN(new Date(publishDate).getTime())) { setParseErr('প্রকাশের সময় সঠিক নয়'); return }
    setParsing(true); setParseErr(''); setParsed(null); setSaveMsg('')
    try {
      const res = await pdfAPI.parse(file)
      setParsed((res.data.questions || []).map(q => ({ ...q, image: q.image || '' })))
      if (!pdfRef.trim() && file?.name) setPdfRef(`pdf:${file.name}`)
      showToast(`✅ ${res.data.count}টি প্রশ্ন extract হয়েছে!`, 'correct-t')
    } catch (err) {
      setParseErr(err.response?.data?.error || '❌ Parse করা যায়নি। পুনরায় চেষ্টা করুন।')
    }
    setParsing(false)
  }

  // Inline edit one extracted question
  const startEdit = (i) => { setEditIdx(i); setEditForm({ ...parsed[i], image: parsed[i].image || '' }) }
  const saveEdit  = ()  => {
    const updated = [...parsed]; updated[editIdx] = editForm
    setParsed(updated); setEditIdx(null)
  }
  const removeQ   = (i) => setParsed(parsed.filter((_,j)=>j!==i))

  const attachQImage = (idx, imageFile) => {
    if (!imageFile) return
    if (imageFile.size > 2 * 1024 * 1024) { showToast('⚠️ ছবি সর্বোচ্চ ২MB', 'wrong-t'); return }
    const r = new FileReader()
    r.onload = e => {
      const u = [...parsed]
      u[idx] = { ...u[idx], image: e.target.result }
      setParsed(u)
    }
    r.readAsDataURL(imageFile)
  }

  // Save all to MongoDB
  const handleSaveAll = async () => {
    if (!parsed?.length) return
    setSaving(true); setSaveMsg('')
    try {
      // const pub = new Date(publishDate)
      // const pub = new Date(publishDate.length === 16 ? publishDate + ':00' : publishDate)
      // const pub = new Date(publishDate.includes('Z') ? publishDate : publishDate + '+06:00')
      // if (Number.isNaN(pub.getTime()))
//       const pub = new Date(publishDate)   // datetime-local is already local time
      // const pubUTC = new Date(pub.getTime() - pub.getTimezoneOffset() * 60000)
     
      // publishDate: new Date(publishDate).toISOString()
if (Number.isNaN(pubUTC.getTime()))
      {
        setSaveMsg('❌ প্রকাশের সময় সঠিক নয়')
        setSaving(false)
        return
      }
      const res = await adminExamsAPI.create({
        subjectId: subjId,
        levelId: lvlId,
        examName,
        publishDate: new Date(publishDate).toISOString(),
        pdfRef: pdfRef.trim() || (file ? `pdf:${file.name}` : ''),
        questions: parsed,
      })
      setSaveMsg(`✅ "${examName}" exam-এর জন্য ${res.data.inserted}টি প্রশ্ন সংরক্ষিত হয়েছে!`)
      showToast(`✅ ${res.data.inserted}টি import হয়েছে!`, 'correct-t')
      setParsed(null); setFile(null); setPdfRef('')
    } catch (err) {
      setSaveMsg('❌ সংরক্ষণ হয়নি: ' + (err.response?.data?.error || err.message))
    }
    setSaving(false)
  }

  const handleDrop = e => {
    e.preventDefault(); dropRef.current?.classList.remove('dragover')
    const f = e.dataTransfer.files[0]
    if (f?.type === 'application/pdf') setFile(f)
    else showToast('⚠️ শুধু PDF ফাইল গ্রহণযোগ্য', 'wrong-t')
  }

  return (
    <div>
      <div className="font-display font-bold text-sm mb-1">📄 PDF → Quiz (AI-Powered)</div>
      <p className="text-muted text-xs mb-4">PDF আপলোড করুন → AI স্বয়ংক্রিয়ভাবে MCQ প্রশ্ন extract করবে → Review করুন → MongoDB-তে সংরক্ষণ করুন</p>

      {/* Step 1: Config */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="font-display font-bold text-blue text-xs mb-3">ধাপ ১: বিষয় ও Level নির্বাচন করুন</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-muted text-xs mb-1">বিষয় *</label>
            <Sel value={subjId} onChange={e=>setSubjId(e.target.value)}>
              <option value="">— বিষয় —</option>
              {subjects.map(s=><option key={s._id} value={s._id}>{s.emoji} {s.name}</option>)}
            </Sel>
          </div>
          <div>
            <label className="block text-muted text-xs mb-1">Level *</label>
            <Sel value={lvlId} onChange={e=>setLvlId(e.target.value)}>
              <option value="">— Level —</option>
              {levels.map(l=><option key={l._id} value={l._id}>{l.name}</option>)}
            </Sel>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-muted text-xs mb-1">Exam Name *</label>
            <input
              value={examName}
              onChange={e => setExamName(e.target.value)}
              placeholder="যেমন: গণিত SSC Model Test-1"
              className="w-full bg-card2 border-[1.5px] border-border rounded-xl px-3.5 py-2.5 text-textprimary font-body text-sm outline-none transition focus:border-accent placeholder-muted"
              maxLength={80}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-muted text-xs mb-1">প্রকাশের তারিখ</label>
            <input
              type="date"
              value={publishDate}
              onChange={e => setPublishDate(e.target.value)}
              className="w-full bg-card2 border-[1.5px] border-border rounded-xl px-3.5 py-2.5 text-textprimary font-body text-sm outline-none transition focus:border-accent placeholder-muted"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-muted text-xs mb-1">PDF রেফারেন্স (ঐচ্ছিক — স্টোরেজ কী / নোট)</label>
            <input
              value={pdfRef}
              onChange={e => setPdfRef(e.target.value)}
              placeholder="যেমন: pdf:model-test-1.pdf"
              className="w-full bg-card2 border-[1.5px] border-border rounded-xl px-3.5 py-2.5 text-textprimary font-body text-sm outline-none transition focus:border-accent placeholder-muted"
            />
          </div>
        </div>
      </div>

      {/* Step 2: Drop zone */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="font-display font-bold text-blue text-xs mb-3">ধাপ ২: PDF আপলোড করুন</div>
        <div
          ref={dropRef}
          className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer transition-all hover:border-accent hover:bg-accent/4"
          style={file ? { borderColor:'var(--green)', background:'rgba(67,233,123,.06)' } : {}}
          onClick={() => document.getElementById('pdfFileInp').click()}
          onDragOver={e=>{e.preventDefault();dropRef.current?.classList.add('dragover')}}
          onDragLeave={()=>dropRef.current?.classList.remove('dragover')}
          onDrop={handleDrop}
        >
          <input id="pdfFileInp" type="file" accept=".pdf" className="hidden" onChange={e=>{if(e.target.files[0])setFile(e.target.files[0])}}/>
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">📄</span>
              <div className="text-left">
                <div className="font-display font-bold text-green text-sm">{file.name}</div>
                <div className="text-muted text-xs">{(file.size/1024/1024).toFixed(2)} MB · PDF</div>
              </div>
              <button onClick={e=>{e.stopPropagation();setFile(null);setParsed(null)}} className="ml-2 text-accent2 text-lg hover:scale-110 transition">✕</button>
            </div>
          ) : (
            <>
              <div className="text-4xl mb-2">📥</div>
              <div className="text-textprimary font-display font-bold text-sm mb-1">PDF drag করুন বা click করে select করুন</div>
              <div className="text-muted text-xs">সর্বোচ্চ ১০ MB · text-based PDF সবচেয়ে ভালো কাজ করে</div>
            </>
          )}
        </div>

        <button onClick={handleParse} disabled={parsing||!file||!subjId||!lvlId||!examName.trim()||!publishDate}
          className="mt-3 w-full py-3 rounded-xl font-display font-bold text-sm text-white transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background:'linear-gradient(135deg,#38b2f5,var(--purple))' }}>
          {parsing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              AI প্রশ্ন extract করছে… (৩০-৬০ সেকেন্ড)
            </span>
          ) : '🤖 AI দিয়ে প্রশ্ন Extract করুন'}
        </button>
        {parseErr && <p className="text-accent2 text-xs mt-2 text-center">{parseErr}</p>}
      </div>

      {/* Step 3: Review extracted questions */}
      {parsed && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <div className="font-display font-bold text-blue text-xs">ধাপ ৩: Review ও Edit করুন ({parsed.length}টি প্রশ্ন)</div>
            <Btn variant="danger" onClick={()=>{setParsed(null);setSaveMsg('')}}>বাতিল</Btn>
          </div>

          <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto">
            {parsed.map((q, i) => (
              <div key={i} className="bg-card2 border border-border rounded-xl p-3">
                {editIdx === i ? (
                  /* Inline edit mode */
                  <div>
                    <textarea className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-textprimary text-xs font-body outline-none focus:border-accent resize-y mb-2" rows={3} value={editForm.q} onChange={e=>setEditForm(f=>({...f,q:e.target.value}))}/>
                    {[0,1,2,3].map(oi=>(
                      <div key={oi} className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs text-muted w-4">{LETTERS[oi]}</span>
                        <input className="flex-1 bg-bg border border-border rounded-lg px-2 py-1 text-textprimary text-xs outline-none focus:border-accent" value={editForm.opts?.[oi]||''} onChange={e=>{const o=[...editForm.opts];o[oi]=e.target.value;setEditForm(f=>({...f,opts:o}))}}/>
                        <input type="radio" name={`editAns${i}`} checked={editForm.ans===oi} onChange={()=>setEditForm(f=>({...f,ans:oi}))} className="w-4 h-4 accent-green cursor-pointer"/>
                      </div>
                    ))}
                    {/* <div className="text-muted text-[.65rem] mt-2 mb-1">🖼️ প্রশ্নের ছবি (ঐচ্ছিক)</div> */}
                    {/* <div className="flex gap-2 items-center mb-2">
                      <input
                        className="flex-1 bg-bg border border-border rounded-lg px-2 py-1 text-textprimary text-xs outline-none focus:border-accent"
                        placeholder="ছবির URL"
                        value={editForm.image?.startsWith('data:') ? '' : (editForm.image || '')}
                        onChange={e => setEditForm(f => ({ ...f, image: e.target.value }))}
                      />
                      <label className="flex-shrink-0 px-2 py-1 rounded-lg bg-purple/20 text-purple text-[.65rem] cursor-pointer border border-purple/30">
                        📁
                        <input type="file" className="hidden" accept="image/*" onChange={e => {
                          const f = e.target.files[0]
                          if (!f) return
                          if (f.size > 2 * 1024 * 1024) { showToast('⚠️ সর্বোচ্চ ২MB', 'wrong-t'); return }
                          const rd = new FileReader()
                          rd.onload = ev => setEditForm(x => ({ ...x, image: ev.target.result }))
                          rd.readAsDataURL(f)
                          e.target.value = ''
                        }}/>
                      </label>
                    </div>
                    {editForm.image ? <img src={editForm.image} alt="" className="max-h-[90px] rounded-lg border border-border object-contain mb-2" onError={e => { e.target.style.display = 'none' }}/> : null} */}
                    {/* Add inside the edit mode div, after the options loop: */}
<div className="mt-2">
  <div className="text-muted text-xs mb-1">🖼️ প্রশ্নের ছবি (ঐচ্ছিক)</div>
  <div className="flex gap-2 items-center">
    <input
      className="flex-1 bg-bg border border-border rounded-lg px-2 py-1 text-textprimary text-xs outline-none focus:border-accent"
      placeholder="https://... or upload"
      value={editForm.image&&!editForm.image.startsWith('data:')?editForm.image:''}
      onChange={e=>setEditForm(f=>({...f,image:e.target.value}))}
    />
    <label className="flex-shrink-0 px-2 py-1 rounded-lg text-white text-xs cursor-pointer font-bold" style={{background:'linear-gradient(135deg,#38b2f5,#6c63ff)'}}>
      📁<input type="file" className="hidden" accept="image/*" onChange={e=>{
        const file=e.target.files[0]; if(!file) return
        if(file.size>2*1024*1024){showToast('⚠️ সর্বোচ্চ ২MB','wrong-t');return}
        const r=new FileReader(); r.onload=ev=>setEditForm(f=>({...f,image:ev.target.result})); r.readAsDataURL(file)
      }}/>
    </label>
  </div>
  {editForm.image&&<img src={editForm.image} alt="" className="mt-1 max-h-[80px] rounded-lg border border-border object-contain" onError={()=>setEditForm(f=>({...f,image:''}))}/>}
</div>
                    <div className="flex gap-2 mt-2">
                      <Btn variant="accent" onClick={saveEdit}>✅ Done</Btn>
                      <Btn variant="outline" onClick={()=>setEditIdx(null)}>বাতিল</Btn>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div>
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-xs text-muted font-bold">প্রশ্ন {i+1}</span>
                      <div className="flex gap-1">
                        <Btn variant="blue" onClick={()=>startEdit(i)}>✏️</Btn>
                        <Btn variant="danger" onClick={()=>removeQ(i)}>🗑️</Btn>
                      </div>
                    </div>
                    {q.context && <div className="text-blue text-[.7rem] mb-1">📌 {q.context}</div>}
                    <div className="text-sm font-display font-bold mb-2 leading-snug">{q.q}</div>
                    <div className="flex flex-col gap-1">
                      {q.opts.map((o,oi)=>(
                        <div key={oi} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border ${oi===q.ans?'border-green bg-green/10 text-green':'border-border text-muted'}`}>
                          <span className="font-bold w-4">{LETTERS[oi]})</span> {o}{oi===q.ans?' ✅':''}
                        </div>
                      ))}
                    </div>
                      {q.explanation && <div className="mt-1.5 text-[.7rem] text-green bg-green/7 rounded-lg px-2 py-1">💡 {q.explanation}</div>}
                      {q.image && <img src={q.image} alt="" className="mt-1.5 max-h-[80px] rounded-lg border border-border object-contain"/>}
                    {q.tags?.length>0 && <div className="flex gap-1 mt-1.5 flex-wrap">{q.tags.map(t=><span key={t} className="text-[.65rem] px-1.5 py-0.5 rounded-full bg-purple/10 border border-purple/30 text-purple">#{t}</span>)}</div>}
                    {q.image ? <img src={q.image} alt="" className="mt-2 max-h-[120px] rounded-lg border border-border object-contain bg-bg"/> : null}
                    <label className="mt-2 inline-flex items-center gap-2 text-[.68rem] text-blue cursor-pointer font-medium">
                      📎 ছবি সংযুক্ত করুন
                      <input type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files[0]; attachQImage(i, f); e.target.value = '' }}/>
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Save all */}
          <button onClick={handleSaveAll} disabled={saving||parsed.length===0}
            className="mt-4 w-full py-3 rounded-xl font-display font-bold text-sm text-[#1a1200] transition hover:-translate-y-0.5 disabled:opacity-50"
            style={{ background:'linear-gradient(135deg,var(--accent),#ff9f43)', boxShadow:'0 4px 20px rgba(247,201,72,.25)' }}>
            {saving
              ? <span className="flex items-center justify-center gap-2"><span className="inline-block w-4 h-4 border-2 border-[#1a1200]/30 border-t-[#1a1200] rounded-full animate-spin"/>সংরক্ষণ হচ্ছে…</span>
              : `💾 ${parsed.length}টি প্রশ্ন MongoDB-তে সংরক্ষণ করুন`}
          </button>
          {saveMsg && <p className={`text-xs mt-2 text-center font-bold ${saveMsg.startsWith('✅')?'text-green':'text-accent2'}`}>{saveMsg}</p>}
        </div>
      )}

      {/* Tips */}
      <div className="bg-card2 border border-border rounded-xl p-3 text-xs text-muted">
        <div className="font-bold text-textprimary mb-1.5">💡 সেরা ফলাফলের জন্য:</div>
        <ul className="space-y-1 list-none">
          {['Text-based PDF ব্যবহার করুন (scanned image PDF কাজ নাও করতে পারে)','প্রতিটি প্রশ্ন clearly formatted হলে ভালো ফলাফল আসে','Extract হওয়ার পর প্রতিটি প্রশ্ন review করুন','ভুল থাকলে ✏️ দিয়ে inline edit করুন, তারপর save করুন'].map(t=>(
            <li key={t} className="flex items-start gap-1.5"><span className="text-accent flex-shrink-0 mt-0.5">→</span>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ── Collection Tab (subject → exam → edit) ──────────────────────────────────
// function CollectionTab() {
//   const { subjects, levels, showToast } = useQuiz()
//   const [fSubj, setFSubj] = useState('')
//   const [fExam, setFExam] = useState('')
//   const [examNames, setExamNames] = useState([])
//   const [rows, setRows] = useState([])
//   const [loading, setLoading] = useState(false)
//   const [editOpen, setEditOpen] = useState(false)
//   const [editRow, setEditRow] = useState(null)
//   const [form, setForm] = useState({})
//   const [err, setErr] = useState('')

//   useEffect(() => {
//     if (!fSubj) {
//       setExamNames([])
//       setFExam('')
//       return
//     }
//     let alive = true
//     adminExamsAPI.list({ subjectId: fSubj })
//       .then(r => {
//         if (!alive) return
//         const names = [...new Set((r.data || []).map(e => e.examName).filter(Boolean))].sort()
//         setExamNames(names)
//         setFExam(fe => (fe && names.includes(fe) ? fe : ''))
//       })
//       .catch(() => { if (alive) setExamNames([]) })
//     return () => { alive = false }
//   }, [fSubj])

//   const loadQuestions = useCallback(async () => {
//     if (!fSubj) { setRows([]); return }
//     setLoading(true)
//     try {
//       const params = { subjectId: fSubj }
//       if (fExam) params.examName = fExam
//       const r = await questionsAPI.collectionList(params)
//       setRows(r.data || [])
//     } catch {
//       showToast('লোড হয়নি', 'wrong-t')
//       setRows([])
//     }
//     setLoading(false)
//   }, [fSubj, fExam, showToast])

//   useEffect(() => { loadQuestions() }, [loadQuestions])

//   const openEdit = (q) => {
//     setEditRow(q)
//     setForm({
//       q: q.q,
//       opts: [...q.opts],
//       ans: q.ans,
//       examName: q.examName || '',
//       publishDate: toDatetimeLocalValue(q.publishDate),
//       marks: q.marks || 1,
//       difficulty: q.difficulty || 'medium',
//       explanation: q.explanation || '',
//       image: q.image || '',
//     })
//     setErr('')
//     setEditOpen(true)
//   }

//   const saveEdit = async () => {
//     if (!form.q?.trim()) { setErr('প্রশ্ন খালি'); return }
//     if (form.opts.some(o => !String(o).trim())) { setErr('সব বিকল্প'); return }
//     const publishDate = new Date(form.publishAt)
//     if (!form.publishAt || Number.isNaN(publishDate.getTime())) { setErr('প্রকাশের সময়'); return }
//     if (!form.examName?.trim()) { setErr('Exam name'); return }
//     try {
//       await questionsAPI.collectionPatch(editRow._id, {
//         q: form.q.trim(),
//         opts: form.opts.map(o => String(o).trim()),
//         ans: form.ans,
//         examName: form.examName.trim(),
//         publishDate: publishDate.toISOString(),
//         marks: parseInt(form.marks, 10) || 1,
//         difficulty: form.difficulty,
//         explanation: form.explanation || '',
//         image: form.image || '',
//       })
//       showToast('✅ সংরক্ষিত', 'correct-t')
//       setEditOpen(false)
//       loadQuestions()
//     } catch (e) {
//       setErr(e.response?.data?.error || 'সংরক্ষণ হয়নি')
//     }
//   }

//   return (
//     <div>
//       <p className="text-muted text-xs mb-3">বিষয় ও (ঐচ্ছিক) পরীক্ষার নাম দিয়ে ফিল্টার করে প্রশ্ন এডিট করুন। Exam নাম/প্রকাশের সময় পরিবর্তন হলে ওই পরীক্ষার সব প্রশ্নে একসাথে প্রযোজ্য।</p>
//       <div className="flex flex-wrap gap-2 mb-3">
//         <Sel className="w-auto text-xs py-1.5 px-2.5 min-w-[160px]" value={fSubj} onChange={e => setFSubj(e.target.value)}>
//           <option value="">— বিষয় —</option>
//           {subjects.map(s => <option key={s._id} value={s._id}>{s.emoji} {s.name}</option>)}
//         </Sel>
//         <Sel className="w-auto text-xs py-1.5 px-2.5 min-w-[200px]" value={fExam} onChange={e => setFExam(e.target.value)} disabled={!fSubj}>
//           <option value="">— সব Exam (নাম ফিল্টার ছাড়া) —</option>
//           {examNames.map(n => <option key={n} value={n}>{n}</option>)}
//         </Sel>
//         <span className="text-xs text-muted self-center">{rows.length} টি</span>
//       </div>

//       <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto">
//         {loading ? <div className="py-8 text-center text-muted animate-pulse">লোড…</div>
//           : !fSubj ? <div className="py-8 text-center text-muted text-sm">বিষয় বেছে নিন</div>
//           : rows.length === 0 ? <div className="py-8 text-center text-muted text-sm">কোনো প্রশ্ন নেই</div>
//           : rows.map((q, i) => {
//             const l = levels.find(x => String(x._id) === String(q.levelId))
//             return (
//               <div key={q._id} className="bg-card border border-border rounded-xl px-3.5 py-3">
//                 <div className="flex justify-between gap-2 mb-1">
//                   <div className="text-sm flex-1 leading-snug line-clamp-3">{q.q}</div>
//                   <div className="flex flex-col items-end gap-0.5 shrink-0">
//                     <span className="text-muted text-[.65rem]">#{i + 1}</span>
//                     {q.examName && <span className="text-[.62rem] text-blue bg-blue/10 px-1.5 py-0.5 rounded max-w-[160px] truncate" title={q.examName}>{q.examName}</span>}
//                     {l && <span className="text-[.62rem] text-purple">{l.short || l.name}</span>}
//                   </div>
//                 </div>
//                 <div className="text-[.65rem] text-muted mb-2">
//                   প্রকাশ: {q.publishDate ? new Date(q.publishDate).toLocaleString() : '—'} · {q.difficulty || 'medium'}
//                 </div>
//                 <Btn variant="blue" onClick={() => openEdit(q)}>✏️ সম্পাদনা</Btn>
//               </div>
//             )
//           })}
//       </div>

//       <Modal open={editOpen} onClose={() => setEditOpen(false)} title="প্রশ্ন / পরীক্ষা আপডেট" size="md">
//         <Row label="Exam Name *"><Inp value={form.examName || ''} onChange={e => setForm(f => ({ ...f, examName: e.target.value }))}/></Row>
//         <Row label="প্রকাশের সময় *"><Inp type="datetime-local" value={form.publishAt || ''} onChange={e => setForm(f => ({ ...f, publishAt: e.target.value }))}/></Row>
//         <div className="grid grid-cols-2 gap-2">
//           <Row label="নম্বর"><Inp type="number" min={1} value={form.marks || 1} onChange={e => setForm(f => ({ ...f, marks: e.target.value }))}/></Row>
//           <Row label="Difficulty">
//             <Sel value={form.difficulty || 'medium'} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
//               <option value="easy">Easy</option>
//               <option value="medium">Medium</option>
//               <option value="hard">Hard</option>
//             </Sel>
//           </Row>
//         </div>
//         <Row label="প্রশ্ন *"><textarea className="w-full bg-card2 border-[1.5px] border-border rounded-xl px-3.5 py-2.5 text-textprimary font-body text-sm outline-none min-h-[72px]" value={form.q || ''} onChange={e => setForm(f => ({ ...f, q: e.target.value }))}/></Row>
//         {[0, 1, 2, 3].map(i => (
//           <div key={i} className="flex items-center gap-2 mb-2">
//             <span className="text-xs w-5 text-muted">{LETTERS[i]}</span>
//             <Inp className="flex-1" value={form.opts?.[i] || ''} onChange={e => { const o = [...(form.opts || ['', '', '', ''])]; o[i] = e.target.value; setForm(f => ({ ...f, opts: o })) }}/>
//             <input type="radio" name="collAns" className="accent-green" checked={form.ans === i} onChange={() => setForm(f => ({ ...f, ans: i }))}/>
//           </div>
//         ))}
//         <Row label="Explanation"><textarea className="w-full bg-card2 border border-border rounded-xl px-3 py-2 text-sm min-h-[48px]" value={form.explanation || ''} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}/></Row>
//         <Row label="Image URL / base64 আংশিক"><Inp value={form.image?.startsWith('data:') ? '(uploaded)' : (form.image || '')} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="https://..."/></Row>
//         {form.image?.startsWith('data:') ? <img src={form.image} alt="" className="max-h-[80px] rounded border mb-2"/> : null}
//         {err && <p className="text-accent2 text-xs text-center mb-2">{err}</p>}
//         <div className="flex gap-2 mt-3">
//           <Btn variant="accent" onClick={saveEdit}>💾 সংরক্ষণ</Btn>
//           <Btn variant="outline" onClick={() => setEditOpen(false)}>বাতিল</Btn>
//         </div>
//       </Modal>
//     </div>
//   )
// }

// ── Collection Tab ────────────────────────────────────────────────────────────
// function CollectionTab() {
//   const { subjects, levels, showToast } = useQuiz()
//   const [fSubj,   setFSubj]  = useState('')
//   const [fExam,   setFExam]  = useState('')
//   const [exams,   setExams]  = useState([])
//   const [qs,      setQs]     = useState([])
//   const [loading, setLoading]= useState(false)
//   const [editId,  setEditId] = useState(null)
//   const [editForm,setEditForm]= useState({})
//   const [err,     setErr]    = useState('')

//   // Load exams when subject changes
//   useEffect(() => {
//     if (!fSubj) { setExams([]); setFExam(''); setQs([]); return }
//     examsAPI.list({ subjectId: fSubj }).then(r => {
//       setExams(r.data)
//       setFExam(''); setQs([])
//     }).catch(() => {})
//   }, [fSubj])

//   // Load questions when exam changes
//   useEffect(() => {
//     if (!fExam) { setQs([]); return }
//     setLoading(true)
//     examsAPI.getQuestions(fExam).then(r => { setQs(r.data) }).catch(() => {}).finally(() => setLoading(false))
//   }, [fExam])

//   const startEdit = (q) => {
//     setEditId(q._id)
//     setEditForm({
//       q: q.q,
//       opts: [...q.opts],
//       ans: q.ans,
//       examName: q.examName || '',
//       publishDate: q.publishDate ? q.publishDate.slice(0,10) : '',
//     })
//     setErr('')
//   }

//   const handleSave = async () => {
//     if (!editForm.q?.trim())             { setErr('⚠️ প্রশ্ন লিখুন'); return }
//     if (!editForm.examName?.trim())      { setErr('⚠️ Exam Name লিখুন'); return }
//     if (!editForm.publishDate)           { setErr('⚠️ Publish Date দিন'); return }
//     if (editForm.opts.some(o=>!o?.trim())){ setErr('⚠️ সব বিকল্প লিখুন'); return }
//     try {
//       await questionsAPI.update(editId, editForm)
//       showToast('✅ আপডেট হয়েছে!', 'correct-t')
//       // Refresh question list
//       const r = await examsAPI.getQuestions(fExam)
//       setQs(r.data)
//       setEditId(null)
//     } catch { setErr('❌ সংরক্ষণ হয়নি') }
//   }

//   const selectedExam = exams.find(e => e._id === fExam)

//   return (
//     <div>
//       <div className="font-display font-bold text-sm mb-3">📚 Collection</div>
//       <div className="grid grid-cols-2 gap-3 mb-4">
//         <div>
//           <label className="block text-muted text-xs mb-1">বিষয় *</label>
//           <Sel value={fSubj} onChange={e=>setFSubj(e.target.value)}>
//             <option value="">— বিষয় নির্বাচন করুন —</option>
//             {subjects.map(s=><option key={s._id} value={s._id}>{s.emoji} {s.name}</option>)}
//           </Sel>
//         </div>
//         <div>
//           <label className="block text-muted text-xs mb-1">Exam Name</label>
//           <Sel value={fExam} onChange={e=>setFExam(e.target.value)} disabled={!fSubj}>
//             <option value="">— Exam নির্বাচন করুন —</option>
//             {exams.map(e=><option key={e._id} value={e._id}>{e.examName} ({new Date(e.publishDate).toLocaleDateString('bn-BD')})</option>)}
//           </Sel>
//         </div>
//       </div>

//       {selectedExam && (
//         <div className="bg-card2 border border-border rounded-xl px-3.5 py-2.5 mb-3 flex justify-between items-center">
//           <div>
//             <span className="font-display font-bold text-accent text-sm">{selectedExam.examName}</span>
//             <span className="text-muted text-xs ml-2">📅 {new Date(selectedExam.publishDate).toLocaleDateString('bn-BD')}</span>
//           </div>
//           <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{qs.length} প্রশ্ন</span>
//         </div>
//       )}

//       {loading && <div className="py-8 text-center text-muted text-sm animate-pulse">লোড হচ্ছে…</div>}

//       {!loading && fExam && qs.length === 0 && (
//         <div className="py-8 text-center text-muted text-sm"><div className="text-3xl mb-2">📭</div>কোনো প্রশ্ন নেই</div>
//       )}

//       <div className="flex flex-col gap-3">
//         {qs.map((q, i) => (
//           <div key={q._id} className="bg-card border border-border rounded-xl p-3.5">
//             {editId === q._id ? (
//               <div>
//                 <div className="grid grid-cols-2 gap-2 mb-2">
//                   <div>
//                     <label className="text-muted text-xs mb-1 block">Exam Name *</label>
//                     <Inp value={editForm.examName} onChange={e=>setEditForm(f=>({...f,examName:e.target.value}))} placeholder="Exam Name"/>
//                   </div>
//                   <div>
//                     <label className="text-muted text-xs mb-1 block">Publish Date *</label>
//                     <Inp type="date" value={editForm.publishDate} onChange={e=>setEditForm(f=>({...f,publishDate:e.target.value}))}/>
//                   </div>
//                 </div>
//                 <textarea className="w-full bg-card2 border-[1.5px] border-border rounded-xl px-3.5 py-2.5 text-textprimary font-body text-sm outline-none focus:border-accent resize-y min-h-[72px] mb-2" value={editForm.q} onChange={e=>setEditForm(f=>({...f,q:e.target.value}))}/>
//                 {[0,1,2,3].map(oi=>(
//                   <div key={oi} className="flex items-center gap-2 mb-1.5">
//                     <span className="text-xs text-muted w-4">{LETTERS[oi]}</span>
//                     <input className="flex-1 bg-card2 border border-border rounded-xl px-3 py-1.5 text-textprimary text-xs outline-none focus:border-accent" value={editForm.opts?.[oi]||''} onChange={e=>{const o=[...editForm.opts];o[oi]=e.target.value;setEditForm(f=>({...f,opts:o}))}}/>
//                     <input type="radio" name={`collAns${q._id}`} checked={editForm.ans===oi} onChange={()=>setEditForm(f=>({...f,ans:oi}))} className="w-4 h-4 accent-green cursor-pointer"/>
//                   </div>
//                 ))}
//                 {err && <p className="text-accent2 text-xs mb-2">{err}</p>}
//                 <div className="flex gap-2 mt-2">
//                   <Btn variant="accent" onClick={handleSave}>💾 সংরক্ষণ</Btn>
//                   <Btn variant="outline" onClick={()=>setEditId(null)}>বাতিল</Btn>
//                 </div>
//               </div>
//             ) : (
//               <div>
//                 <div className="flex justify-between items-start mb-1.5">
//                   <span className="text-xs text-muted font-bold">#{i+1}</span>
//                   <Btn variant="blue" onClick={()=>startEdit(q)}>✏️ সম্পাদনা</Btn>
//                 </div>
//                 <div className="text-sm font-display font-bold mb-2 leading-snug">{q.q}</div>
//                 <div className="flex flex-col gap-1">
//                   {q.opts.map((o,oi)=>(
//                     <div key={oi} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border ${oi===q.ans?'border-green bg-green/10 text-green':'border-border text-muted'}`}>
//                       <span className="font-bold w-4">{LETTERS[oi]})</span> {o}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }
function CollectionTab() {
  const { subjects, levels, showToast } = useQuiz()
  const [fSubj,      setFSubj]     = useState('')
  const [fExam,      setFExam]     = useState('')
  const [exams,      setExams]     = useState([])
  const [qs,         setQs]        = useState([])
  const [loading,    setLoading]   = useState(false)
  const [editQId,    setEditQId]   = useState(null)
  const [editQForm,  setEditQForm] = useState({})
  const [qErr,       setQErr]      = useState('')
  // Exam-level edit
  const [examEditOpen, setExamEditOpen] = useState(false)
  const [examEditForm, setExamEditForm] = useState({})
  const [examEditErr,  setExamEditErr]  = useState('')

  const loadExams = useCallback(async (subjId) => {
    if (!subjId) { setExams([]); setFExam(''); setQs([]); return }
    // try { const r = await examsAPI.list({ subjectId: subjId }); setExams(r.data) } catch {}
    try { const r = await adminExamsAPI.listAll({ subjectId: subjId }); setExams(r.data) } catch {}
  }, [])

  useEffect(() => { loadExams(fSubj) }, [fSubj, loadExams])

  useEffect(() => {
    if (!fExam) { setQs([]); return }
    setLoading(true)
    adminExamsAPI.getQuestions(fExam).then(r => setQs(r.data)).catch(()=>{}).finally(()=>setLoading(false))
  }, [fExam])

  const selectedExam = exams.find(e => e._id === fExam)

  // ── Delete entire exam ──
  const handleDeleteExam = async () => {
    if (!selectedExam) return
    if (!confirm(`"${selectedExam.examName}" এবং এর সব প্রশ্ন মুছে ফেলবো?`)) return
    try {
      await adminExamsAPI.remove(fExam)
      showToast('🗑️ Exam মুছা হয়েছে', 'wrong-t')
      setFExam(''); setQs([])
      loadExams(fSubj)
    } catch { showToast('❌ মুছা যায়নি', 'wrong-t') }
  }

  // ── Open exam edit modal ──
  const openExamEdit = () => {
    if (!selectedExam) return
    setExamEditForm({
      examName:    selectedExam.examName,
      subjectId:   selectedExam.subject?._id  || fSubj,
      levelId:     selectedExam.level?._id    || '',
      publishDate: selectedExam.publishDate
        ? new Date(examEditForm.publishDate).toISOString()  
        : '',
    })
    setExamEditErr('')
    setExamEditOpen(true)
  }

  const handleExamEditSave = async () => {
    if (!examEditForm.examName?.trim()) return setExamEditErr('⚠️ Exam Name লিখুন')
    if (!examEditForm.publishDate)      return setExamEditErr('⚠️ Publish Date দিন')
    try {
      await adminExamsAPI.update(fExam, {
        examName:    examEditForm.examName.trim(),
        subjectId:   examEditForm.subjectId,
        levelId:     examEditForm.levelId,
        publishDate: examEditForm.publishDate,
      })
      showToast('✅ Exam আপডেট হয়েছে!', 'correct-t')
      setExamEditOpen(false)
      loadExams(fSubj)
      // Refresh questions too (publishDate may have changed)
      const r = await adminExamsAPI.getQuestions(fExam)
      setQs(r.data)
    } catch { setExamEditErr('❌ আপডেট হয়নি') }
  }

  // ── Question edit ──
  const startEditQ = (q) => {
    setEditQId(q._id)
    setEditQForm({ q: q.q, opts: [...q.opts], ans: q.ans })
    setQErr('')
  }
  const handleSaveQ = async () => {
    if (!editQForm.q?.trim())              return setQErr('⚠️ প্রশ্ন লিখুন')
    if (editQForm.opts.some(o=>!o?.trim()))return setQErr('⚠️ সব বিকল্প লিখুন')
    if (editQForm.ans < 0)                 return setQErr('⚠️ সঠিক উত্তর select করুন')
    try {
      await questionsAPI.update(editQId, editQForm)
      showToast('✅ আপডেট!', 'correct-t')
      const r = await adminExamsAPI.getQuestions(fExam)
      setQs(r.data); setEditQId(null)
    } catch { setQErr('❌ সংরক্ষণ হয়নি') }
  }

  return (
    <div>
      <div className="font-display font-bold text-sm mb-3">📚 Collection</div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-muted text-xs mb-1">বিষয় *</label>
          <Sel value={fSubj} onChange={e=>setFSubj(e.target.value)}>
            <option value="">— বিষয় নির্বাচন করুন —</option>
            {subjects.map(s=><option key={s._id} value={s._id}>{s.emoji} {s.name}</option>)}
          </Sel>
        </div>
        <div>
          <label className="block text-muted text-xs mb-1">Exam</label>
          <Sel value={fExam} onChange={e=>setFExam(e.target.value)} disabled={!fSubj}>
            <option value="">— Exam নির্বাচন করুন —</option>
            {exams.map(e=><option key={e._id} value={e._id}>{e.examName} ({new Date(e.publishDate).toLocaleDateString('bn-BD')})</option>)}
          </Sel>
        </div>
      </div>

      {/* Exam action bar */}
      {selectedExam && (
        <div className="bg-card2 border border-border rounded-xl px-3.5 py-2.5 mb-4 flex flex-wrap gap-2 items-center justify-between">
          <div>
            <span className="font-display font-bold text-accent text-sm">{selectedExam.examName}</span>
            <span className="text-muted text-xs ml-2">
              📅 {new Date(selectedExam.publishDate).toLocaleString('bn-BD')}
            </span>
            <span className="text-muted text-xs ml-2">({qs.length} প্রশ্ন)</span>
          </div>
          <div className="flex gap-2">
            <Btn variant="blue"   onClick={openExamEdit}>✏️ Exam Edit</Btn>
            <Btn variant="danger" onClick={handleDeleteExam}>🗑️ Exam মুছুন</Btn>
          </div>
        </div>
      )}

      {loading && <div className="py-8 text-center text-muted text-sm animate-pulse">লোড হচ্ছে…</div>}
      {!loading && fExam && qs.length === 0 && (
        <div className="py-8 text-center text-muted text-sm"><div className="text-3xl mb-2">📭</div>কোনো প্রশ্ন নেই</div>
      )}

      {/* Question list */}
      <div className="flex flex-col gap-3">
        {qs.map((q, i) => (
          <div key={q._id} className="bg-card border border-border rounded-xl p-3.5">
            {editQId === q._id ? (
              <div>
                <textarea className="w-full bg-card2 border-[1.5px] border-border rounded-xl px-3.5 py-2.5 text-textprimary font-body text-sm outline-none focus:border-accent resize-y min-h-[72px] mb-2"
                  value={editQForm.q} onChange={e=>setEditQForm(f=>({...f,q:e.target.value}))}/>
                {[0,1,2,3].map(oi=>(
                  <div key={oi} className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-muted w-4">{LETTERS[oi]}</span>
                    <input className="flex-1 bg-card2 border border-border rounded-xl px-3 py-1.5 text-textprimary text-xs outline-none focus:border-accent"
                      value={editQForm.opts?.[oi]||''} onChange={e=>{const o=[...editQForm.opts];o[oi]=e.target.value;setEditQForm(f=>({...f,opts:o}))}}/>
                    <input type="radio" name={`collAns${q._id}`} checked={editQForm.ans===oi}
                      onChange={()=>setEditQForm(f=>({...f,ans:oi}))} className="w-4 h-4 accent-green cursor-pointer"/>
                  </div>
                ))}
                {qErr && <p className="text-accent2 text-xs mb-2">{qErr}</p>}
                <div className="flex gap-2 mt-2">
                  <Btn variant="accent" onClick={handleSaveQ}>💾 সংরক্ষণ</Btn>
                  <Btn variant="outline" onClick={()=>setEditQId(null)}>বাতিল</Btn>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-xs text-muted font-bold">#{i+1}</span>
                  <Btn variant="blue" onClick={()=>startEditQ(q)}>✏️ সম্পাদনা</Btn>
                </div>
                <div className="text-sm font-display font-bold mb-2 leading-snug">{q.q}</div>
                <div className="flex flex-col gap-1">
                  {q.opts.map((o,oi)=>(
                    <div key={oi} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border ${oi===q.ans?'border-green bg-green/10 text-green':'border-border text-muted'}`}>
                      <span className="font-bold w-4">{LETTERS[oi]}</span> {o}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Exam Edit Modal */}
      <Modal open={examEditOpen} onClose={()=>setExamEditOpen(false)} title="✏️ Exam তথ্য আপডেট করুন">
        <Row label="Exam Name *">
          <Inp value={examEditForm.examName||''} onChange={e=>setExamEditForm(f=>({...f,examName:e.target.value}))} placeholder="Exam Name"/>
        </Row>
        <Row label="বিষয় *">
          <Sel value={examEditForm.subjectId||''} onChange={e=>setExamEditForm(f=>({...f,subjectId:e.target.value}))}>
            <option value="">— বিষয় —</option>
            {subjects.map(s=><option key={s._id} value={s._id}>{s.emoji} {s.name}</option>)}
          </Sel>
        </Row>
        <Row label="Level">
          <Sel value={examEditForm.levelId||''} onChange={e=>setExamEditForm(f=>({...f,levelId:e.target.value}))}>
            <option value="">— Level —</option>
            {levels.map(l=><option key={l._id} value={l._id}>{l.name}</option>)}
          </Sel>
        </Row>
        <Row label="Publish Date">
          <Inp type="date" value={examEditForm.publishDate ? examEditForm.publishDate.slice(0,10) : ''} onChange={e=>setExamEditForm(f=>({...f,publishDate:e.target.value}))}/>
        </Row>
        {examEditErr && <p className="text-accent2 text-xs mb-2 text-center">{examEditErr}</p>}
        <div className="flex gap-2 mt-4">
          <button onClick={handleExamEditSave} className="flex-1 py-2.5 rounded-xl font-display font-bold text-sm text-[#1a1200]" style={{background:'linear-gradient(135deg,var(--accent),#ff9f43)'}}>💾 সংরক্ষণ</button>
          <button onClick={()=>setExamEditOpen(false)} className="flex-1 py-2.5 rounded-xl font-display font-semibold text-sm text-muted border border-border">বাতিল</button>
        </div>
      </Modal>
    </div>
  )
}

function StudentsTab() {
  const { showToast } = useQuiz()
  const [students, setStudents]   = useState([])
  const [loading,  setLoading]    = useState(false)
  const [search,   setSearch]     = useState('')
  const [filter,   setFilter]     = useState('')   // '' | 'true' | 'false'
  const [toggling, setToggling]   = useState(null) // uid being toggled

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search.trim()) params.email = search.trim()
      if (filter !== '')  params.hasPurchased = filter
      const r = await studentsAPI.getAll(params)
      setStudents(r.data)
    } catch { showToast('লোড হয়নি', 'wrong-t') }
    setLoading(false)
  }, [search, filter]) // eslint-disable-line

  useEffect(() => { load() }, [load])

  const handleToggle = async (student) => {
    const next = !student.hasPurchased
    if (!confirm(`"${student.email}" এর Purchase status ${next ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করবো?`)) return
    setToggling(student.firebaseUid)
    try {
      await studentsAPI.updatePurchase(student.firebaseUid, next)
      showToast(next ? '✅ Purchase সক্রিয় করা হয়েছে' : '⚠️ Purchase নিষ্ক্রিয় করা হয়েছে', next ? 'correct-t' : 'wrong-t')
      load()
    } catch { showToast('❌ আপডেট হয়নি', 'wrong-t') }
    setToggling(null)
  }

  return (
    <div>
      <div className="font-display font-bold text-sm mb-3">👥 Student Data</div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Inp
          className="flex-1 min-w-[180px]"
          placeholder="ইমেইল দিয়ে খুঁজুন…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Sel className="w-auto text-xs py-1.5 px-2.5" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="">— সব Student —</option>
          <option value="true">✅ Purchased</option>
          <option value="false">❌ Not Purchased</option>
        </Sel>
      </div>

      {loading && <div className="py-8 text-center text-muted text-sm animate-pulse">লোড হচ্ছে…</div>}

      {!loading && students.length === 0 && (
        <div className="py-8 text-center text-muted text-sm"><div className="text-3xl mb-2">👤</div>কোনো Student নেই</div>
      )}

      <div className="flex flex-col gap-2">
        {students.map(s => (
          <div key={s.firebaseUid} className="bg-card border border-border rounded-xl px-3.5 py-3 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-textprimary text-sm truncate">{s.displayName || '—'}</div>
              <div className="text-muted text-xs truncate">{s.email}</div>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className={`text-[.65rem] px-1.5 py-0.5 rounded-full border ${s.emailVerified?'border-green/40 text-green bg-green/8':'border-accent2/40 text-accent2 bg-accent2/8'}`}>
                  {s.emailVerified ? '✅ Verified' : '❌ Unverified'}
                </span>
                <span className="text-[.65rem] px-1.5 py-0.5 rounded-full border border-border text-muted">
                  📱 {s.devices?.length || 0} device{s.devices?.length !== 1 ? 's' : ''}
                </span>
                {s.purchasedAt && (
                  <span className="text-[.65rem] px-1.5 py-0.5 rounded-full border border-border text-muted">
                    📅 {new Date(s.purchasedAt).toLocaleDateString('bn-BD')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.hasPurchased?'bg-green/15 text-green':'bg-accent2/15 text-accent2'}`}>
                {s.hasPurchased ? '✅ Purchased' : '❌ Not Purchased'}
              </span>
              <button
                onClick={() => handleToggle(s)}
                disabled={toggling === s.firebaseUid}
                className={`text-xs font-display font-bold px-3 py-1.5 rounded-lg border transition hover:-translate-y-0.5 disabled:opacity-50 ${s.hasPurchased?'border-accent2/40 text-accent2':'border-green/40 text-green'}`}>
                {toggling === s.firebaseUid ? '⏳' : s.hasPurchased ? 'Revoke' : 'Approve'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab() {
  const { timerMin, setTimerMin, quizOptions, setQuizOptions, showToast } = useQuiz()
  const [newTimer, setNewTimer] = useState(timerMin)
  const [newPass,  setNewPass]  = useState('')
  const [confPass, setConfPass] = useState('')
  const [passErr,  setPassErr]  = useState('')
  const [saving,   setSaving]   = useState(false)

  const saveTimer = async () => {
    const m = parseInt(newTimer)
    if (m<1||m>180) { showToast('⚠️ ১–১৮০ মিনিট','wrong-t'); return }
    setSaving(true)
    try { await settingsAPI.update({ timerMin: m }); setTimerMin(m); showToast(`✅ Timer: ${m} মিনিট`,'correct-t') } catch {}
    setSaving(false)
  }

  const savePass = async () => {
    if (!newPass) { setPassErr('⚠️ লিখুন!'); return }
    if (newPass.length<4) { setPassErr('⚠️ ৪+ অক্ষর!'); return }
    if (newPass!==confPass) { setPassErr('⚠️ মিলছে না!'); return }
    setSaving(true)
    try {
      const { authAPI } = await import('../../api/index.js')
      await authAPI.changePassword(newPass)
      setNewPass(''); setConfPass(''); setPassErr('')
      showToast('✅ পাসওয়ার্ড পরিবর্তিত!','correct-t')
    } catch (e) { setPassErr(e.response?.data?.error||'❌ হয়নি') }
    setSaving(false)
  }

  const saveOption = async (key, val) => {
    const next = { ...quizOptions, [key]: val }
    setQuizOptions(next)
    try { await settingsAPI.update({ [key]: val }) } catch {}
  }

  const Toggle = ({ label, sub, checked, onChange }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0">
      <div><div className="text-textprimary text-sm">{label}</div>{sub&&<div className="text-muted text-xs mt-0.5">{sub}</div>}</div>
      <label className="switch flex-shrink-0"><input type="checkbox" checked={checked} onChange={onChange}/><span className="slider"/></label>
    </div>
  )

  return (
    <div>
      <div className="font-display font-bold text-sm mb-4">⚙️ Quiz Settings</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="font-display font-bold text-blue text-sm mb-3">⏱️ Quiz Timer</div>
          <label className="text-muted text-xs mb-1 block">সময় (মিনিটে)</label>
          <Inp type="number" min={1} max={180} value={newTimer} onChange={e=>setNewTimer(e.target.value)}/>
          <div className="text-xs text-muted mt-1 mb-2">বর্তমান: <span className="text-textprimary font-semibold">{timerMin} মিনিট</span></div>
          <Btn variant="green" onClick={saveTimer}>{saving?'…':'💾 সংরক্ষণ'}</Btn>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="font-display font-bold text-blue text-sm mb-3">🔐 Admin Password</div>
          <label className="text-muted text-xs mb-1 block">নতুন Password</label>
          <Inp type="password" placeholder="নতুন পাসওয়ার্ড" value={newPass} onChange={e=>setNewPass(e.target.value)} className="mb-2"/>
          <label className="text-muted text-xs mb-1 block">নিশ্চিত করুন</label>
          <Inp type="password" placeholder="আবার লিখুন" value={confPass} onChange={e=>setConfPass(e.target.value)} className="mb-2"/>
          {passErr&&<p className="text-accent2 text-xs mb-2">{passErr}</p>}
          <Btn variant="blue" onClick={savePass}>{saving?'…':'🔒 পরিবর্তন'}</Btn>
        </div>
      </div>
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="font-display font-bold text-blue text-sm mb-2">🎛️ Quiz Options</div>
        <Toggle label="Options shuffle" sub="বিকল্পগুলো random order-এ" checked={!!quizOptions.shuffle} onChange={e=>saveOption('shuffle',e.target.checked)}/>
        <Toggle label="Explanation দেখানো" sub="Result-এ উত্তরের ব্যাখ্যা" checked={quizOptions.showExplanation!==false} onChange={e=>saveOption('showExplanation',e.target.checked)}/>
        <Toggle label="প্রশ্ন random order" sub="প্রতিবার ক্রম বদলাবে" checked={quizOptions.randomQ!==false} onChange={e=>saveOption('randomQ',e.target.checked)}/>
      </div>
    </div>
  )
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
const TABS = [
  { id:'results',   label:'📊 Results' },
  { id:'subjects',  label:'📚 Subjects' },
  { id:'levels',    label:'🏫 Levels' },
  { id:'questions', label:'📝 Questions' },
  { id:'pdf',       label:'📄 PDF Upload' },
  { id:'collection', label:'📚 Collection' },
  { id: 'settings', label: '⚙️ Settings' },
  { id:'students', label:'👥 Students' },
]

export default function AdminPage() {
  const navigate = useNavigate()
  const { logout } = useQuiz()
  const [activeTab, setActiveTab] = useState('results')

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  const content = {
    results:    <ResultsTab />,
    subjects:   <SubjectsTab />,
    levels:     <LevelsTab />,
    questions:  <QuestionsTab />,
    pdf:        <PdfTab />,
    collection: <CollectionTab />,
    students: <StudentsTab />,
    settings:   <SettingsTab />,
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen px-4 py-8 screen-animate" style={{ background:'var(--bg)' }}>
      <div className="w-full max-w-[860px]">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-display font-extrabold text-[1.35rem] text-blue">⚙️ Admin Panel</h1>
          <div className="flex items-center gap-2">
            <Link to="/" className="px-3 py-1.5 border border-border text-muted font-display font-semibold text-xs rounded-xl transition hover:border-blue hover:text-blue">🏠 হোম</Link>
            <button onClick={handleLogout} className="px-3 py-1.5 border border-border text-muted font-display font-semibold text-xs rounded-xl transition hover:border-accent2 hover:text-accent2">লগআউট</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4 bg-card border border-border rounded-xl p-1.5">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              className={`flex-1 py-2 px-1.5 rounded-lg font-display font-bold text-xs transition-all min-w-[80px] ${activeTab===t.id?'bg-card2 text-accent':'bg-transparent text-muted hover:text-textprimary'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="screen-animate" key={activeTab}>
          {content[activeTab]}
        </div>
      </div>
    </div>
  )
}
