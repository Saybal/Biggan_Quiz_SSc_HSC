import React from 'react'
import { useQuiz } from '../../context/QuizContext.jsx'

export default function Toast() {
  const { toast } = useQuiz()

  const colorMap = {
    'correct-t': 'border-green text-green',
    'wrong-t':   'border-accent2 text-accent2',
    'info-t':    'border-blue text-blue',
  }

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 z-[200]
        bg-card2 border rounded-xl px-5 py-2.5 text-sm font-medium
        shadow-[0_8px_32px_rgba(0,0,0,.4)] pointer-events-none
        transition-transform duration-300
        ${colorMap[toast.cls] || 'border-border text-textprimary'}
        ${toast.visible ? '-translate-x-1/2 translate-y-0' : '-translate-x-1/2 translate-y-24'}
      `}
    >
      {toast.msg}
    </div>
  )
}
