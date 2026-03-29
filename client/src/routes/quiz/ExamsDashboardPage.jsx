import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQuiz } from "../../context/QuizContext.jsx";
import { examsAPI } from "../../api/index.js";

function formatDateUTC(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function ExamsDashboardPage() {
  const navigate = useNavigate();
  // const {
  //   selSubjectId,
  //   subjects,
  //   showToast,
  //   catalogueLoading,
  // } = useQuiz()

  const {
    selSubjectId: ctxSubjectId,
    subjects,
    showToast,
    catalogueLoading,
    user,
  } = useQuiz();
  const selSubjectId = ctxSubjectId || sessionStorage.getItem("qs_subjectId");

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [activeTab, setActiveTab] = useState("today"); // today | previous
  const [meritModal, setMeritModal]     = useState(null)  // { examName, leaderboard, total }
  const [meritLoading, setMeritLoading] = useState(false)

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const r = await examsAPI.list({ subjectId: selSubjectId });
        if (!alive) return;
        setExams(r.data);
      } catch (err) {
        if (!alive) return;
        showToast("⚠️ Exams লোড হয়নি", "wrong-t");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }
    if (selSubjectId) load();
    else {
      setLoading(false);
      setExams([]);
    }
    return () => {
      alive = false;
    };
  }, [selSubjectId, showToast]);

  useEffect(() => {
    if (!catalogueLoading && !selSubjectId) {
      navigate("/quiz/subject", { replace: true });
    }
  }, [catalogueLoading, selSubjectId, navigate]);

  const subject = useMemo(
    () => subjects.find((s) => s._id === selSubjectId),
    [subjects, selSubjectId],
  );

  const todayExams = useMemo(() => exams.filter((e) => e.isToday), [exams]);
  const previousExams = useMemo(() => exams.filter((e) => !e.isToday), [exams]);
  const list = activeTab === "today" ? todayExams : previousExams;

  const handleTake = (examId, isToday) => {
    sessionStorage.setItem("qs_examId", examId);
    if (!isToday) showToast("You did not participate in this exam", "wrong-t");
    navigate("/quiz/join");
  };

  // const handleMerit = async (examId) => {
  //   try {
  //     const r = await examsAPI.myExamMerit(examId);
  //     const { participatedOnTime, attempted, rank, total } = r.data || {};

  //     if (!attempted || !participatedOnTime) {
  //       showToast("You did not participate in this exam", "wrong-t");
  //       return;
  //     }

  //     showToast(`✅ আপনার র‍্যাঙ্ক: #${rank} (মোট ${total})`, "correct-t");
  //   } catch (err) {
  //     showToast("Merit লোড হয়নি", "wrong-t");
  //   }
  // };

  const handleMerit = async (exam) => {
    setMeritLoading(true)
    setMeritModal({ examName: exam.examName, leaderboard: [], total: 0, loading: true })
    try {
      const r = await examsAPI.examLeaderboard(exam._id)
      setMeritModal({
        examName:    exam.examName,
        leaderboard: r.data.leaderboard || [],
        total:       r.data.total || 0,
        loading:     false,
      })
    } catch {
      showToast('Merit লোড হয়নি', 'wrong-t')
      setMeritModal(null)
    }
    setMeritLoading(false)
  }

  return (
    <div
      className="flex flex-col items-center justify-start min-h-screen px-4 py-20 screen-animate"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-[820px] pb-10">
        <div className="mb-5">
          <div className="text-accent text-xs font-bold tracking-wide uppercase">
            📚 Exams Dashboard
          </div>
          <h1 className="font-display font-extrabold text-[2rem] text-textprimary mt-1">
            {subject ? `${subject.emoji} ${subject.name}` : "বাছাই করা বিষয়"}
          </h1>
          <p className="text-muted text-sm mt-1">
            প্রকাশের তারিখ অনুযায়ী Today এবং Previous exams দেখুন
          </p>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setActiveTab("today")}
            className={`px-4 py-2 rounded-xl font-display font-bold text-sm transition border ${activeTab === "today" ? "bg-card2 border-accent text-accent" : "bg-card border-border text-muted hover:border-accent hover:text-accent"}`}
          >
            আজকের পরীক্ষা
          </button>
          <button
            onClick={() => setActiveTab("previous")}
            className={`px-4 py-2 rounded-xl font-display font-bold text-sm transition border ${activeTab === "previous" ? "bg-card2 border-accent2 text-accent2" : "bg-card border-border text-muted hover:border-accent2 hover:text-accent2"}`}
          >
            পূর্ববর্তী পরীক্ষা
          </button>
        </div>

        {loading || catalogueLoading ? (
          <div className="py-10 text-center text-muted text-sm animate-pulse">
            লোড হচ্ছে…
          </div>
        ) : list.length === 0 ? (
          <div className="py-10 text-center text-muted text-sm">
            <div className="text-4xl mb-2">
              {activeTab === "today" ? "📅" : "🕰️"}
            </div>
            এই সময়ে কোনো exam নেই
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {list.map((exam) => (
              <div
                key={exam._id}
                className="bg-card border border-border rounded-2xl p-4"
              >
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div>
                    <div className="font-display font-extrabold text-lg text-textprimary">
                      {exam.examName}
                    </div>
                    <div className="text-muted text-xs mt-1">
                      {exam.level
                        ? `🏫 ${exam.level.short || exam.level.name}`
                        : "—"}{" "}
                      · 📌 {formatDateUTC(exam.publishDate)}
                    </div>
                  </div>
                  <div
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${exam.isToday ? "bg-green/10 border-green/30 text-green" : "bg-accent2/10 border-accent2/30 text-accent2"}`}
                  >
                    {exam.isToday ? "Today" : "Previous"}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleTake(exam._id, exam.isToday)}
                    className="flex-1 min-w-[160px] py-2.5 rounded-xl font-display font-extrabold text-sm text-[#1a1200] transition hover:-translate-y-0.5"
                    style={{
                      background:
                        "linear-gradient(135deg,var(--accent),#ff9f43)",
                    }}
                  >
                    পরীক্ষা দাও
                  </button>
                  <button
                    onClick={() => handleMerit(exam)}
                    className="flex-1 min-w-[120px] py-2.5 rounded-xl font-display font-bold text-sm transition border border-border text-muted hover:border-accent hover:text-accent"
                    style={{ background: "transparent" }}
                  >
                    মেরিট
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Merit Modal */}
      {meritModal && (
        <div
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setMeritModal(null)}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-[600px] max-h-[85vh] overflow-y-auto p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="font-display font-extrabold text-lg text-accent">
                  {meritModal.examName}
                </div>
                <div className="text-muted text-xs mt-0.5">
                  মোট অংশগ্রহণকারী: {meritModal.total} জন
                </div>
              </div>
              <button
                onClick={() => setMeritModal(null)}
                className="text-muted hover:text-accent2 text-xl font-bold px-2"
              >
                ✕
              </button>
            </div>

            {meritModal.loading ? (
              <div className="py-10 text-center text-muted animate-pulse">
                লোড হচ্ছে…
              </div>
            ) : meritModal.leaderboard.length === 0 ? (
              <div className="py-10 text-center text-muted">
                <div className="text-4xl mb-2">📭</div>
                এখনো কেউ অংশগ্রহণ করেনি
              </div>
            ) : (
              <>
                {/* Header */}
                <div
                  className="grid text-muted text-xs font-semibold uppercase px-3 py-2 bg-card2 rounded-xl mb-2"
                  style={{ gridTemplateColumns: "36px 1fr 80px 90px 60px" }}
                >
                  <div>#</div>
                  <div>নাম</div>
                  <div className="text-center">নম্বর</div>
                  <div className="text-center">সঠিক/ভুল/Skip</div>
                  <div className="text-right">সময়</div>
                </div>
                {meritModal.leaderboard.map((p, i) => {
                  const isMe = p.firebaseUid === user?.uid;
                  const medal =
                    i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                  return (
                    <div
                      key={i}
                      className={`grid px-3 py-2.5 rounded-xl mb-1 items-center text-sm border ${isMe ? "border-accent bg-accent/8" : "border-transparent hover:bg-card2"}`}
                      style={{ gridTemplateColumns: "36px 1fr 80px 90px 60px" }}
                    >
                      <div
                        className={`font-display font-bold ${i < 3 ? "text-accent" : "text-muted text-xs"}`}
                      >
                        {medal || `#${i + 1}`}
                      </div>
                      <div>
                        <div
                          className={`font-semibold text-sm ${isMe ? "text-accent" : "text-textprimary"}`}
                        >
                          {p.playerName}
                          {isMe && (
                            <span className="ml-1.5 text-[.6rem] bg-accent/15 border border-accent/40 text-accent px-1.5 py-0.5 rounded-full">
                              তুমি
                            </span>
                          )}
                        </div>
                        {p.school && (
                          <div className="text-muted text-[.7rem]">
                            🏛️ {p.school}
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.pct >= 70 ? "bg-green/15 text-green" : p.pct >= 40 ? "bg-accent/15 text-accent" : "bg-accent2/15 text-accent2"}`}
                        >
                          {p.score}/{p.fullMarks}
                        </span>
                      </div>
                      <div className="text-center text-xs text-muted">
                        ✅{p.correct} ❌{p.wrong} ⏭️{p.skip}
                      </div>
                      <div className="text-right text-blue text-xs">
                        {p.timeStr}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
