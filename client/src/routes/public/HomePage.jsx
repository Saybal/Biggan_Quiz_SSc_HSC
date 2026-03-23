import React from "react";
import { Link, useNavigate } from "react-router";
import SciBg from "../../components/layout/SciBg.jsx";
import ScientistPortraits from "../../components/layout/ScientistPortraits.jsx";
import { useQuiz } from "../../context/QuizContext.jsx";

export default function HomePage() {
  const navigate = useNavigate();
  const { subjects, catalogueLoading, catalogueError, loadCatalogue } =
    useQuiz();

  const handleStartQuiz = () => {
    sessionStorage.removeItem("qs_subjectId");
    sessionStorage.removeItem("qs_levelId");
    sessionStorage.removeItem("qs_session");
    sessionStorage.removeItem("qs_result");
    navigate("/quiz/select-subject");
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-5 py-8 z-10 overflow-hidden screen-animate">
      <SciBg />
      <div className="relative z-10 flex flex-col items-center w-full max-w-[480px]">
        <ScientistPortraits />

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-blue/10 border border-blue/30 text-blue text-xs font-semibold px-3.5 py-1.5 rounded-full mb-4 tracking-wide">
            🔬 Science Quiz Platform
          </div>
          <h1 className="font-display font-extrabold text-[3.8rem] leading-none text-textprimary mb-2">
            বিজ্ঞান <span className="gradient-text-accent">কুইজ</span>
          </h1>
          <p className="text-muted text-[.9rem] leading-relaxed mb-5">
            গণিত · পদার্থ · রসায়ন · জীববিজ্ঞান
            <br />
            <span className="text-[.82rem] opacity-70">
              বিজ্ঞানীদের পথে হাঁটো, নিজেকে প্রমাণ করো!
            </span>
          </p>

          {/* Stats bar */}
          <div className="flex items-center justify-center bg-card border border-border rounded-2xl py-3 px-1">
            {[
              { icon: "📝", val: "MCQ", lbl: "Format" },
              { icon: "⏱️", val: "৩০", lbl: "মিনিট" },
              { icon: "🏆", val: "Merit", lbl: "Ranking" },
              { icon: "✅", val: "১ নম্বর", lbl: "প্রতি প্রশ্ন" },
            ].map((s, i, arr) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center px-3.5 py-1">
                  <span className="text-[1rem] mb-0.5">{s.icon}</span>
                  <span className="font-display font-bold text-sm text-textprimary">
                    {s.val}
                  </span>
                  <span className="text-[.65rem] text-muted">{s.lbl}</span>
                </div>
                {i < arr.length - 1 && <div className="w-px h-8 bg-border" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Server status */}
        {catalogueError && (
          <div className="w-full mb-4 bg-accent2/10 border border-accent2/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-accent2 text-sm">⚠️ {catalogueError}</span>
            <button
              onClick={loadCatalogue}
              className="text-xs font-bold text-accent2 border border-accent2/50 px-2.5 py-1 rounded-lg hover:bg-accent2/10 transition"
            >
              Retry
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2.5 w-full mb-4">
          <button
            onClick={handleStartQuiz}
            disabled={catalogueLoading}
            className="flex items-center gap-3.5 rounded-2xl px-5 py-4 text-left transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg,#0e1f15,#0a1525)",
              border: "1.5px solid rgba(67,233,123,.45)",
              boxShadow: "0 4px 24px rgba(67,233,123,.12)",
            }}
          >
            <span className="text-[2.2rem] flex-shrink-0">
              {catalogueLoading ? "⏳" : "⚗️"}
            </span>
            <span className="flex-1">
              <span className="block font-display font-extrabold text-xl text-green">
                {catalogueLoading ? "লোড হচ্ছে..." : "কুইজ শুরু করো"}
              </span>
              <span className="block text-muted text-xs mt-0.5">
                বিষয় ও Standard বেছে নাও
              </span>
            </span>
            <span className="text-green opacity-70 text-xl font-bold">→</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <Link
              to="/leaderboard"
              className="flex items-center justify-center gap-1.5 bg-card border border-border text-muted font-display font-bold text-[.92rem] rounded-xl py-3 transition-all hover:border-accent hover:text-accent hover:bg-accent/5"
            >
              <span>🏆</span> Merit List
            </Link>
            <Link
              to="/admin/login"
              className="flex items-center justify-center gap-1.5 bg-card border border-border text-muted font-display font-bold text-[.92rem] rounded-xl py-3 transition-all hover:border-blue hover:text-blue hover:bg-blue/5"
            >
              <span>🔐</span> Admin
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 justify-center">
          {(catalogueLoading
            ? ["🧮 গণিত", "🔬 পদার্থ", "⚗️ রসায়ন", "🧬 জীববিজ্ঞান"]
            : (Array.isArray(subjects)
                ? subjects
                : subjects?.subjects || []
              ).map((s) => `${s.emoji} ${s.name}`)
          ).map((pill, i) => (
            <span
              key={i}
              className="bg-card2 border border-border rounded-full px-3 py-1 text-sm text-muted"
              style={{
                animation: `pillFloat 4s ease-in-out ${i * 0.5}s infinite`,
              }}
            >
              {pill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
