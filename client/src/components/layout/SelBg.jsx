import React from 'react'

export default function SelBg({ patternColor = 'rgba(247,201,72,0.05)', symbols = ['🧮','🔬','⚗️','🧬','∑','λ','∫','π'] }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="selGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0L0 0 0 40" fill="none" stroke={patternColor} strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="800" height="600" fill="url(#selGrid)"/>
        <circle cx="400" cy="300" r="280" fill="none" stroke="rgba(247,201,72,0.05)" strokeWidth="1" strokeDasharray="8,6"/>
        <circle cx="400" cy="300" r="200" fill="none" stroke="rgba(56,178,245,0.05)" strokeWidth="1" strokeDasharray="4,8"/>
        <circle cx="400" cy="300" r="120" fill="none" stroke="rgba(67,233,123,0.06)" strokeWidth="1"/>
      </svg>

      {symbols.map((sym, i) => (
        <span
          key={i}
          className="absolute text-[2rem] pointer-events-none select-none"
          style={{
            opacity: .07,
            animation: `floatSym ${7 + (i % 3)}s ease-in-out ${i * 0.8}s infinite`,
            top:  ['5%','8%','15%','80%','40%','55%','25%','68%'][i % 8],
            left: i % 2 === 0 ? `${4 + i * 5}%` : undefined,
            right:i % 2 !== 0 ? `${4 + i * 4}%` : undefined,
            fontFamily: i > 3 ? 'monospace' : undefined,
          }}
        >
          {sym}
        </span>
      ))}
    </div>
  )
}
