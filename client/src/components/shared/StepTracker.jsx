import React from 'react'

export default function StepTracker({ step }) {
  // step: 1 = subject, 2 = level, 3 = join
  const steps = [
    { label: 'বিষয়' },
    { label: 'Standard' },
    { label: 'শুরু' },
  ]

  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((s, i) => {
        const num    = i + 1
        const active = num === step
        const done   = num < step

        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`
                  w-[34px] h-[34px] rounded-full flex items-center justify-content-center
                  font-display font-bold text-sm flex items-center justify-center
                  transition-all duration-300
                  ${done   ? 'text-[#0d1a10]'  : active ? 'text-white' : 'text-muted'}
                `}
                style={{
                  background: done
                    ? 'linear-gradient(135deg,#43e97b,#38b2f5)'
                    : active
                    ? 'linear-gradient(135deg,#38b2f5,#a78bfa)'
                    : 'var(--card2)',
                  border: done || active ? 'none' : '2px solid var(--border)',
                  boxShadow: active ? '0 0 14px rgba(56,178,245,.4)' : 'none',
                }}
              >
                {done ? '✓' : num}
              </div>
              <span
                className={`text-[.65rem] font-medium whitespace-nowrap ${
                  done ? 'text-green' : active ? 'text-blue font-bold' : 'text-muted'
                }`}
              >
                {s.label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                className="w-12 h-0.5 mx-1 mb-[18px] transition-all duration-300"
                style={{
                  background: done
                    ? 'linear-gradient(90deg,#43e97b,#38b2f5)'
                    : 'var(--border)',
                }}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
