/**
 * client/src/components/shared/Navbar.jsx  (Firebase version)
 *
 * ONLY the changed sections are noted with // CHANGED comments.
 * Everything else (layout, breadcrumb, mobile tab bar) is identical.
 *
 * Changes:
 *   - isAdminAuthed now reads from context (Firebase role) not localStorage
 *   - User avatar / display name shown when logged in
 *   - Login / Register links shown when not logged in
 *   - Logout calls context.logout() (Firebase signOut)
 */
import React, { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router'
import { useQuiz } from '../../context/QuizContext.jsx'

const HIDDEN_ROUTES  = ['/quiz/play']
const MINIMAL_ROUTES = ['/quiz/result']
const QUIZ_FLOW_PATHS = ['/quiz/select-subject', '/quiz/select-level', '/quiz/join']

const QUIZ_STEPS = [
  { path: '/quiz/select-subject', label: 'বিষয়',    icon: '📚' },
  { path: '/quiz/select-level',   label: 'Standard', icon: '🏫' },
  { path: '/quiz/join',           label: 'শুরু',     icon: '🚀' },
]

function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > threshold)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [threshold])
  return scrolled
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 group flex-shrink-0" aria-label="হোমে যাও">
      <span className="text-2xl transition-transform duration-300 group-hover:rotate-12"
        style={{ filter:'drop-shadow(0 0 8px rgba(247,201,72,.5))' }}>⚗️</span>
      <span className="font-display font-extrabold text-lg leading-none hidden sm:block">
        <span className="gradient-text-accent">বিজ্ঞান</span>
        <span className="text-textprimary"> কুইজ</span>
      </span>
    </Link>
  )
}

function NavItem({ to, icon, label, end = false }) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) =>
        `relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-display font-bold text-sm transition-all group
        ${isActive ? 'text-accent' : 'text-muted hover:text-textprimary'}`
      }>
      {({ isActive }) => (
        <>
          <span className="text-base leading-none">{icon}</span>
          <span>{label}</span>
          <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-300
            ${isActive ? 'w-3/4 opacity-100' : 'w-0 opacity-0 group-hover:w-1/2 group-hover:opacity-40'}`}
            style={{ background:'var(--accent)' }}/>
        </>
      )}
    </NavLink>
  )
}

function QuizBreadcrumb({ location, subjects, levels, selSubjectId, selLevelId }) {
  const currentIdx = QUIZ_STEPS.findIndex(s => s.path === location.pathname)
  const subject    = subjects.find(s => s._id === selSubjectId)
  const level      = levels.find(l => l._id === selLevelId)

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      {QUIZ_STEPS.map((step, i) => {
        const isDone = i < currentIdx, isActive = i === currentIdx
        let label = step.label
        if (isDone && i === 0 && subject) label = subject.name
        if (isDone && i === 1 && level)   label = level.short || level.name

        return (
          <React.Fragment key={step.path}>
            {isDone ? (
              <Link to={step.path}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition hover:opacity-80 flex-shrink-0"
                style={{ background:'rgba(67,233,123,.15)', border:'1px solid rgba(67,233,123,.35)', color:'var(--green)' }}>
                <span>✓</span>
                <span className="hidden md:inline">{label}</span>
              </Link>
            ) : (
              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 select-none
                ${isActive ? 'text-accent border border-accent/40 bg-accent/10' : 'text-muted border border-border opacity-50'}`}>
                <span>{isActive ? step.icon : String(i + 1)}</span>
                {isActive && <span className="hidden md:inline">{step.label}</span>}
              </span>
            )}
            {i < QUIZ_STEPS.length - 1 && (
              <span className="text-[.6rem] flex-shrink-0" style={{ color: isDone ? 'var(--green)' : 'var(--border)' }}>→</span>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── CHANGED: MobileTabBar now uses Firebase user state ───────────────────────
function MobileTabBar({ isAdminAuthed, user, location }) {
  const tabs = [
    { to:'/',            icon:'🏠', label:'হোম',   end:true },
    { to:'/quiz/select-subject', icon:'⚗️', label:'কুইজ' },
    { to:'/leaderboard', icon:'🏆', label:'Merit' },
    // CHANGED: show Login tab when not logged in, Admin when admin
    ...(isAdminAuthed
      ? [{ to:'/admin/dashboard', icon:'⚙️', label:'Admin' }]
      : user
      ? [{ to:'/leaderboard',    icon:'👤', label:user.displayName?.split(' ')[0] || 'User' }]
      : [{ to:'/login',          icon:'🔐', label:'লগইন' }]
    ),
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex sm:hidden items-stretch"
      style={{ background:'rgba(22,25,39,0.96)', backdropFilter:'blur(20px)', borderTop:'1px solid var(--border)', paddingBottom:'env(safe-area-inset-bottom,0px)' }}>
      {tabs.map(tab => (
        <NavLink key={tab.to} to={tab.to} end={tab.end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[.6rem] font-display font-bold transition-colors
            ${isActive ? 'text-accent' : 'text-muted'}`
          }>
          {({ isActive }) => (
            <>
              <span className={`text-xl leading-none transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}>{tab.icon}</span>
              <span>{tab.label}</span>
              {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full" style={{ background:'var(--accent)' }}/>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

// ── Main Navbar ───────────────────────────────────────────────────────────────
export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const scrolled = useScrolled()

  // CHANGED: get user, role, logout from Firebase-powered context
  const { subjects, levels, selSubjectId, selLevelId, user, role, isAdminAuthed, logout } = useQuiz()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const isQuizFlow   = QUIZ_FLOW_PATHS.includes(location.pathname)
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isAuthRoute  = ['/login', '/register'].includes(location.pathname)

  useEffect(() => { setMobileMenuOpen(false) }, [location.pathname])
  useEffect(() => {
    if (!mobileMenuOpen) return
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMobileMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mobileMenuOpen])

  if (HIDDEN_ROUTES.includes(location.pathname)) return null
  const isMinimal = MINIMAL_ROUTES.includes(location.pathname)

  // CHANGED: handle logout with Firebase
  const handleLogout = async () => {
    await logout()
    navigate('/')
    setMobileMenuOpen(false)
  }

  // CHANGED: user display name or email initial for avatar
  const userInitial = user?.displayName?.[0] || user?.email?.[0] || '?'

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'shadow-[0_4px_32px_rgba(0,0,0,.4)]' : 'shadow-none'}`}
        style={{
          background:     scrolled ? 'rgba(13,15,26,0.92)' : 'rgba(13,15,26,0.70)',
          backdropFilter: 'blur(20px)',
          borderBottom:   `1px solid ${scrolled ? 'rgba(42,47,72,0.9)' : 'rgba(42,47,72,0.4)'}`,
        }}>
        <div className="max-w-[900px] mx-auto px-4 h-14 flex items-center gap-3">
          <Logo />

          {/* Minimal mode */}
          {isMinimal && (
            <div className="flex-1 flex justify-end">
              <Link to="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-muted font-display font-semibold text-xs transition hover:border-accent hover:text-accent">← হোমে</Link>
            </div>
          )}

          {/* Quiz breadcrumb */}
          {!isMinimal && isQuizFlow && (
            <div className="flex-1 flex justify-center px-2">
              <QuizBreadcrumb location={location} subjects={subjects} levels={levels} selSubjectId={selSubjectId} selLevelId={selLevelId}/>
            </div>
          )}

          {/* Full nav links */}
          {!isMinimal && !isQuizFlow && (
            <nav className="hidden sm:flex items-center gap-0.5 flex-1 justify-center">
              <NavItem to="/"            icon="🏠" label="হোম"       end />
              <NavItem to="/leaderboard" icon="🏆" label="Merit List" />
              <NavItem to="/quiz/select-subject" icon="⚗️" label="কুইজ শুরু" />
            </nav>
          )}

          {/* Right section — CHANGED for Firebase auth */}
          {!isMinimal && (
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">

              {user ? (
                // ── Logged in: show avatar + role badge + logout ───────────
                <div className="hidden sm:flex items-center gap-2">
                  {isAdminAuthed && (
                    <NavLink to="/admin/dashboard"
                      className={({ isActive }) =>
                        `flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-display font-bold text-xs transition-all
                        ${isActive ? 'border-blue/60 text-blue bg-blue/10' : 'border-border text-muted hover:border-blue hover:text-blue'}`
                      }>
                      ⚙️ Admin
                    </NavLink>
                  )}

                  {/* User avatar button */}
                  <div className="relative" ref={isAdminAuthed ? null : menuRef}>
                    <button
                      onClick={() => setMobileMenuOpen(v => !v)}
                      className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-xl border border-border text-sm font-display font-bold transition hover:border-accent"
                      title={user.email}
                    >
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold text-[#1a1200]"
                        style={{ background:'linear-gradient(135deg,var(--accent),#ff9f43)' }}>
                        {userInitial.toUpperCase()}
                      </span>
                      <span className="text-muted text-xs max-w-[80px] truncate hidden md:block">
                        {user.displayName || user.email?.split('@')[0]}
                      </span>
                      <span className="text-muted text-[.6rem]">▾</span>
                    </button>

                    {/* Dropdown */}
                    {mobileMenuOpen && (
                      <div className="absolute right-0 top-10 w-44 bg-card border border-border rounded-xl shadow-[0_8px_32px_rgba(0,0,0,.5)] overflow-hidden z-50 screen-animate">
                        <div className="px-3 py-2.5 border-b border-border">
                          <div className="text-textprimary text-xs font-bold truncate">{user.displayName || 'User'}</div>
                          <div className="text-muted text-[.65rem] truncate">{user.email}</div>
                          {isAdminAuthed && <span className="inline-block mt-1 text-[.6rem] bg-blue/10 border border-blue/30 text-blue px-2 py-0.5 rounded-full">Admin</span>}
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2.5 text-accent2 text-xs font-display font-bold hover:bg-accent2/10 transition flex items-center gap-2"
                        >
                          🚪 লগআউট
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : !isAuthRoute && (
                // ── Not logged in: show Login + Register ──────────────────
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login"
                    className="px-3 py-1.5 rounded-xl border border-border text-muted font-display font-bold text-xs transition hover:border-accent hover:text-accent">
                    লগইন
                  </Link>
                  <Link to="/register"
                    className="px-3.5 py-1.5 rounded-xl font-display font-bold text-xs text-[#1a1200] transition hover:-translate-y-0.5"
                    style={{ background:'linear-gradient(135deg,var(--accent),#ff9f43)', boxShadow:'0 2px 12px rgba(247,201,72,.25)' }}>
                    রেজিস্ট্রেশন
                  </Link>
                </div>
              )}

              {/* CTA — only when not on quiz flow or admin */}
              {!isQuizFlow && !isAdminRoute && !isAuthRoute && (
                <Link to="/quiz/select-subject"
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-display font-bold text-xs text-[#1a1200] transition hover:-translate-y-0.5"
                  style={{ background:'linear-gradient(135deg,var(--accent),#ff9f43)', boxShadow:'0 2px 12px rgba(247,201,72,.25)' }}
                  onClick={() => {
                    sessionStorage.removeItem('qs_subjectId')
                    sessionStorage.removeItem('qs_levelId')
                    sessionStorage.removeItem('qs_session')
                    sessionStorage.removeItem('qs_result')
                  }}>
                  কুইজ শুরু →
                </Link>
              )}

              {/* Hamburger for mobile */}
              {!isQuizFlow && (
                <button
                  className="sm:hidden flex flex-col items-center justify-center w-9 h-9 rounded-xl border border-border gap-1.5 transition hover:border-accent"
                  onClick={() => setMobileMenuOpen(v => !v)}
                  aria-expanded={mobileMenuOpen}
                >
                  {[0,1,2].map(i => (
                    <span key={i} className={`block h-0.5 w-5 rounded-full bg-textprimary origin-center transition-all duration-300
                      ${mobileMenuOpen && i === 0 ? 'rotate-45 translate-y-2'  : ''}
                      ${mobileMenuOpen && i === 1 ? 'opacity-0 scale-x-0'      : ''}
                      ${mobileMenuOpen && i === 2 ? '-rotate-45 -translate-y-2': ''}`}/>
                  ))}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mobile dropdown — CHANGED: different items based on auth state */}
        <div className={`sm:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
          style={{ borderTop: mobileMenuOpen ? '1px solid var(--border)' : 'none' }}>
          <nav className="flex flex-col gap-1 px-4 py-3">
            {[
              { to:'/',            icon:'🏠', label:'হোম',          end:true },
              { to:'/leaderboard', icon:'🏆', label:'Merit List' },
              { to:'/quiz/select-subject', icon:'⚗️', label:'কুইজ শুরু করো' },
              ...(isAdminAuthed ? [{ to:'/admin/dashboard', icon:'⚙️', label:'Admin Panel' }] : []),
              ...(!user ? [
                { to:'/login',    icon:'🔐', label:'লগইন' },
                { to:'/register', icon:'✏️', label:'রেজিস্ট্রেশন' },
              ] : []),
            ].map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-display font-bold text-sm transition-all
                  ${isActive ? 'bg-accent/10 text-accent border border-accent/30' : 'text-muted hover:bg-card2 border border-transparent'}`
                }
                onClick={() => setMobileMenuOpen(false)}>
                {({ isActive }) => (
                  <><span className="text-xl">{item.icon}</span><span className="flex-1">{item.label}</span>{isActive && <span className="text-xs text-accent">●</span>}</>
                )}
              </NavLink>
            ))}

            {/* Logout if logged in */}
            {user && (
              <button onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-display font-bold text-sm text-accent2 hover:bg-accent2/10 border border-transparent transition-all">
                <span className="text-xl">🚪</span>
                <span>লগআউট ({user.displayName || user.email?.split('@')[0]})</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      <div className="h-14" aria-hidden="true" />

      {/* Mobile bottom tab bar */}
      {!isMinimal && <MobileTabBar isAdminAuthed={isAdminAuthed} user={user} location={location} />}
    </>
  )
}
