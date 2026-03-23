import React from 'react'
import { Link } from 'react-router'
export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-5 text-center" style={{ background:'var(--bg)' }}>
      <div className="text-8xl mb-4">🔭</div>
      <h1 className="font-display font-extrabold text-[3rem] gradient-text-accent leading-none mb-2">404</h1>
      <p className="text-textprimary font-display font-bold text-xl mb-2">পৃষ্ঠাটি খুঁজে পাওয়া যায়নি</p>
      <p className="text-muted text-sm mb-8 max-w-xs">এই পথটি বিশ্বব্রহ্মাণ্ডে নেই — হোমে ফিরে যাও।</p>
      <Link to="/" className="px-6 py-3 rounded-xl font-display font-bold text-[#1a1200] transition hover:-translate-y-0.5"
        style={{ background:'linear-gradient(135deg,var(--accent),#ff9f43)', boxShadow:'0 4px 20px rgba(247,201,72,.3)' }}>
        ← হোমে ফিরে যাও
      </Link>
    </div>
  )
}
