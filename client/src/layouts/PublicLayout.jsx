import React from 'react'
import { Outlet } from 'react-router'
export default function PublicLayout() {
  return <div className="min-h-screen pb-20 sm:pb-0" style={{ background:'var(--bg)' }}><Outlet /></div>
}
