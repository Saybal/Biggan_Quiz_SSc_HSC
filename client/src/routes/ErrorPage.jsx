import React from 'react'
import { Link, useRouteError, isRouteErrorResponse } from 'react-router'
export default function ErrorPage() {
  const error = useRouteError()
  let title   = 'কিছু একটা ভুল হয়েছে'
  let message = 'অপ্রত্যাশিত একটি সমস্যা হয়েছে।'
  if (isRouteErrorResponse(error)) { title = `${error.status} — ${error.statusText}`; message = error.data?.message || message }
  else if (error instanceof Error) { message = error.message }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-5 text-center" style={{ background:'var(--bg)' }}>
      <div className="text-7xl mb-4">⚡</div>
      <h1 className="font-display font-extrabold text-[2rem] text-accent2 mb-2">{title}</h1>
      <p className="text-muted text-sm mb-8 max-w-sm">{message}</p>
      <Link to="/" className="px-6 py-3 rounded-xl font-display font-bold text-[#1a1200] transition hover:-translate-y-0.5"
        style={{ background:'linear-gradient(135deg,var(--accent),#ff9f43)', boxShadow:'0 4px 20px rgba(247,201,72,.3)' }}>
        ← হোমে ফিরে যাও
      </Link>
    </div>
  )
}
