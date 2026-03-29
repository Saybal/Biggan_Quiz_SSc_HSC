import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuiz } from '../../context/QuizContext.jsx'
import { useTimer } from '../../hooks/useTimer.js'
import { examsAPI, resultsAPI } from '../../api/index.js'

const LETTERS = ['ক', 'খ', 'গ', 'ঘ']

function renderLinked(text, wordLinks) {
  if (!wordLinks?.length) return text
  let r = text
  ;[...wordLinks].sort((a, b) => b.word.length - a.word.length).forEach(({ word, url }) => {
    r = r.replace(
      word,
      `<span class="q-linked-word" onclick="window.open('${encodeURIComponent(url)}','_blank','noopener')">${word}<sup style="font-size:.55em;opacity:.6">🔗</sup></span>`,
    )
  })
  return r
}

export default function ExamPlayPage() {
  const navigate = useNavigate()
  const {
    quizSession,
    setQuizSession,
    setLastResult,
    quizOptions,
  } = useQuiz()

  const [submitting, setSubmitting] = useState(false)

  const questions = quizSession?.questions || []

  const answeredCount = useMemo(
    () => questions.filter(q => q._selected !== undefined).length,
    [questions],
  )

  const finishQuiz = useCallback(
    async (qs) => {
      if (!quizSession) return

      setSubmitting(true)
      timer.stop()

      const submittedAt = Date.now()
      const startedAt = quizSession.startedAt || submittedAt
      const timeTaken = Math.max(0, Math.round((submittedAt - startedAt) / 1000))
      const mm = Math.floor(timeTaken / 60)
      const ss = timeTaken % 60

      const finalScore = qs.reduce((a, q) => a + (q._selected === q.ans ? (q.marks || 1) : 0), 0)
      const fullMarks = qs.reduce((a, q) => a + (q.marks || 1), 0)
      const pct = fullMarks > 0 ? Math.round((finalScore / fullMarks) * 100) : 0
      const correct = qs.filter(q => q._selected === q.ans).length
      const wrong = qs.filter(q => q._selected !== undefined && q._selected !== q.ans).length
      const skip = qs.filter(q => q._selected === undefined).length

      const timeStr = `${mm}মি ${ss}সে`
      const examId = quizSession.examId || sessionStorage.getItem('qs_examId')

      const answers = qs.map(q => ({
        questionId: q._id,
        selected: q._selected === undefined ? null : q._selected,
      }))

      const localEntry = {
        name: quizSession.player,
        school: quizSession.school,
        score: finalScore,
        fullMarks,
        pct,
        correct,
        wrong,
        skip,
        timeStr,
      }

      try {
        if (examId) {
          const payload = {
            examId,
            playerName: quizSession.player,
            school: quizSession.school,
            answers,
            startedAt: startedAt,
            submittedAt: submittedAt,
            timeSec: timeTaken,
            timeStr,
          }
          const res = await examsAPI.submitAttempt(payload)
          const { attempt, rank, total } = res.data

          setLastResult({
            entry: {
              name: attempt.playerName,
              school: attempt.school,
              score: attempt.score,
              fullMarks: attempt.fullMarks,
              pct: attempt.pct,
              correct: attempt.correct,
              wrong: attempt.wrong,
              skip: attempt.skip,
              timeStr: attempt.timeStr,
            },
            questions: qs,
            myRank: attempt.participatedOnTime ? rank : '?',
            totalInRanked: attempt.participatedOnTime ? total : '?',
            showExplanation: quizOptions.showExplanation,
            participatedOnTime: attempt.participatedOnTime,
          })
        } else {
          // Legacy submit → subject+level leaderboard
          const payload = {
            name: quizSession.player,
            school: quizSession.school,
            subjectId: quizSession.subjectId,
            levelId: quizSession.levelId,
            score: finalScore,
            fullMarks,
            pct,
            correct,
            wrong,
            skip,
            timeSec: timeTaken,
            timeStr,
          }
          const res = await resultsAPI.save(payload)
          const { result, rank, total } = res.data
          setLastResult({
            entry: {
              name: result.name,
              school: result.school,
              score: result.score,
              fullMarks: result.fullMarks,
              pct: result.pct,
              correct: result.correct,
              wrong: result.wrong,
              skip: result.skip,
              timeStr: result.timeStr,
            },
            questions: qs,
            myRank: rank,
            totalInRanked: total,
            showExplanation: quizOptions.showExplanation,
            participatedOnTime: true,
          })
        }
      } catch {
        // API failure: still show result based on local scoring.
        setLastResult({
          entry: localEntry,
          questions: qs,
          myRank: '?',
          totalInRanked: '?',
          showExplanation: quizOptions.showExplanation,
          participatedOnTime: true,
        })
      } finally {
        sessionStorage.setItem('qs_result', 'true')
        sessionStorage.removeItem('qs_session')
        navigate('/quiz/result')
      }
    },
    [navigate, quizOptions.showExplanation, quizSession, setLastResult],
  )

  const onExpire = useCallback(() => {
    if (submitting) return
    finishQuiz(quizSession?.questions || [])
  }, [finishQuiz, quizSession, submitting])

  const timer = useTimer(quizSession?.totalSeconds || 1800, onExpire)
  useEffect(() => { timer.start() }, []) // eslint-disable-line

  if (!quizSession) return null

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6 screen-animate" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-[980px] pb-10">
        <div className="flex justify-between items-start gap-3 mb-4">
          <div>
            <div className="text-accent font-semibold text-sm">👤 {quizSession.player}</div>
            <div className="text-muted text-xs mt-1">🏫 {quizSession.school}</div>
          </div>

          <div className="flex items-center gap-2 border rounded-xl px-4 py-2 font-display font-bold text-base" style={{ borderColor: timer.warn ? 'var(--accent2)' : 'var(--border)', color: timer.warn ? 'var(--accent2)' : 'var(--textprimary)' }}>
            ⏱️ <span>{timer.fmt()}</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-muted text-xs mb-1">Answered: {answeredCount} / {questions.length} · Skip allowed</div>
          <div className="bg-card2 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-400"
              style={{
                width: `${questions.length ? Math.round((answeredCount / questions.length) * 100) : 0}%`,
                background: 'linear-gradient(90deg,var(--accent),#ff9f43)',
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {questions.map((q, qi) => {
            const selected = q._selected
            return (
              <div key={q._id || qi} className="bg-card border border-border rounded-2xl px-4 py-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="font-display font-bold text-textprimary">
                      প্রশ্ন {qi + 1}
                      <span className="text-muted text-xs ml-2">✦ {q.marks || 1}</span>
                    </div>
                    {q.context ? <div className="text-blue text-xs bg-blue/8 border border-blue/25 rounded-lg px-3 py-1 mt-1">📌 {q.context}</div> : null}
                  </div>
                  <div className="text-muted text-xs">{selected === undefined ? '⬜ Unanswered' : `✅ Selected ${LETTERS[selected]}`}</div>
                </div>

                {q.image ? (
                  <div className="mb-3 rounded-xl overflow-hidden border border-border max-h-[220px]">
                    <img
                      src={q.image}
                      alt=""
                      className="w-full max-h-[220px] object-contain bg-bg"
                      onError={e => { e.target.parentElement.style.display = 'none' }}
                    />
                  </div>
                ) : null}

                <div
                  className="font-display font-bold text-[1.02rem] leading-[1.55] text-textprimary pr-8 whitespace-pre-line"
                  dangerouslySetInnerHTML={q.wordLinks?.length ? { __html: renderLinked(q.q, q.wordLinks) } : undefined}
                >
                  {!q.wordLinks?.length ? q.q : undefined}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-4">
                  {q.opts.map((opt, oi) => {
                    const isSel = selected === oi
                    return (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => {
                          if (submitting || selected != undefined) return
                          const newQs = questions.map((qq, j) => (j === qi ? { ...qq, _selected: oi } : qq))
                          setQuizSession({ ...quizSession, questions: newQs })
                        }}
                        disabled={submitting || selected != undefined}
                        className={`text-left border-[1.5px] rounded-xl px-4 py-3 transition ${isSel ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-card2 hover:border-accent hover:text-accent hover:bg-accent/6'}`}
                      >
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg mr-3 font-display font-extrabold flex-shrink-0 ${isSel ? 'bg-accent text-white' : 'bg-border text-muted'}`}>
                          {LETTERS[oi]}
                        </span>
                        <span>{opt}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => finishQuiz(quizSession.questions)}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl font-display font-bold text-sm text-[#1a1200] transition hover:-translate-y-0.5 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,var(--accent),#ff9f43)', boxShadow: '0 4px 20px rgba(247,201,72,.25)' }}
          >
            {submitting ? 'জমা হচ্ছে…' : 'Submit'}
          </button>
          <div className="flex-1 bg-card2 border border-border rounded-xl p-3 text-xs text-muted flex items-center justify-center sm:justify-start">
            টিপ: সব প্রশ্ন উত্তর না দিলেও Submit করা যাবে।
          </div>
        </div>
      </div>
    </div>
  )
}

