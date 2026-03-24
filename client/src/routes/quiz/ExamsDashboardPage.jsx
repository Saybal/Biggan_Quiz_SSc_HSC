import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuiz } from '../../context/QuizContext.jsx'
import { examsAPI } from '../../api/index.js'

function formatDateUTC(d) {
  if (!d) return '-'
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return '-'
  return dt.toISOString().slice(0, 10) // YYYY-MM-DD
}

export default function ExamsDashboardPage() {
  const navigate = useNavigate()
  const {
    selSubjectId,
    subjects,
    showToast,
    catalogueLoading,
  } = useQuiz()

  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState([])
  const [activeTab, setActiveTab] = useState('today') // today | previous

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      try {
        const r = await examsAPI.list({ subjectId: selSubjectId })
        if (!alive) return
        setExams(r.data)
      } catch (err) {
        if (!alive) return
        showToast('⚠️ Exams লোড হয়নি', 'wrong-t')
      } finally {
        if (!alive) return
        setLoading(false)
      }
    }
    if (selSubjectId) load()
    else {
      setLoading(false)
      setExams([])
    }
    return () => { alive = false }
  }, [selSubjectId, showToast])

  const subject = useMemo(
    () => subjects.find(s => s._id === selSubjectId),
    [subjects, selSubjectId],
  )

  const todayExams = useMemo(() => exams.filter(e => e.isToday), [exams])
  const previousExams = useMemo(() => exams.filter(e => !e.isToday), [exams])
  const list = activeTab === 'today' ? todayExams : previousExams

  const handleTake = (examId, isToday) => {
    sessionStorage.setItem('qs_examId', examId)
    if (!isToday) showToast('You did not participate in this exam', 'wrong-t')
    navigate('/quiz/join')
  }

  const handleMerit = async (examId) => {
    try {
      const r = await examsAPI.myExamMerit(examId)
      const { participatedOnTime, attempted, rank, total } = r.data || {}

      if (!attempted || !participatedOnTime) {
        showToast('You did not participate in this exam', 'wrong-t')
        return
      }

      showToast(`✅ আপনার র‍্যাঙ্ক: #${rank} (মোট ${total})`, 'correct-t')
    } catch (err) {
      showToast('Merit লোড হয়নি', 'wrong-t')
    }
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen px-4 py-20 screen-animate" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-[820px] pb-10">
        <div className="mb-5">
          <div className="text-accent text-xs font-bold tracking-wide uppercase">📚 Exams Dashboard</div>
          <h1 className="font-display font-extrabold text-[2rem] text-textprimary mt-1">
            {subject ? `${subject.emoji} ${subject.name}` : 'বাছাই করা বিষয়'}
          </h1>
          <p className="text-muted text-sm mt-1">প্রকাশের তারিখ অনুযায়ী Today এবং Previous exams দেখুন</p>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 rounded-xl font-display font-bold text-sm transition border ${activeTab === 'today' ? 'bg-card2 border-accent text-accent' : 'bg-card border-border text-muted hover:border-accent hover:text-accent'}`}
          >
            আজকের পরীক্ষা
          </button>
          <button
            onClick={() => setActiveTab('previous')}
            className={`px-4 py-2 rounded-xl font-display font-bold text-sm transition border ${activeTab === 'previous' ? 'bg-card2 border-accent2 text-accent2' : 'bg-card border-border text-muted hover:border-accent2 hover:text-accent2'}`}
          >
            পূর্ববর্তী পরীক্ষা
          </button>
        </div>

        {loading || catalogueLoading ? (
          <div className="py-10 text-center text-muted text-sm animate-pulse">লোড হচ্ছে…</div>
        ) : list.length === 0 ? (
          <div className="py-10 text-center text-muted text-sm">
            <div className="text-4xl mb-2">{activeTab === 'today' ? '📅' : '🕰️'}</div>
            এই সময়ে কোনো exam নেই
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {list.map((exam) => (
              <div key={exam._id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div>
                    <div className="font-display font-extrabold text-lg text-textprimary">{exam.examName}</div>
                    <div className="text-muted text-xs mt-1">
                      {exam.level ? `🏫 ${exam.level.short || exam.level.name}` : '—'} ·
                      {' '}
                      📌 {formatDateUTC(exam.publishDate)}
                    </div>
                  </div>
                  <div className={`text-xs font-bold px-3 py-1 rounded-full border ${exam.isToday ? 'bg-green/10 border-green/30 text-green' : 'bg-accent2/10 border-accent2/30 text-accent2'}`}>
                    {exam.isToday ? 'Today' : 'Previous'}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleTake(exam._id, exam.isToday)}
                    className="flex-1 min-w-[160px] py-2.5 rounded-xl font-display font-extrabold text-sm text-[#1a1200] transition hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg,var(--accent),#ff9f43)' }}
                  >
                    পরীক্ষা দাও
                  </button>
                  <button
                    onClick={() => handleMerit(exam._id)}
                    className="flex-1 min-w-[120px] py-2.5 rounded-xl font-display font-bold text-sm transition border border-border text-muted hover:border-accent hover:text-accent"
                    style={{ background: 'transparent' }}
                  >
                    মেরিট
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

