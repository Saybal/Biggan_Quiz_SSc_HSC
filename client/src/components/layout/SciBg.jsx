import React from 'react'

export default function SciBg() {
  return (
    <div className="sci-bg fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Grid + math SVG */}
      <svg
        className="absolute inset-0 w-full h-full opacity-100"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1000 700"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M50 0L0 0 0 50" fill="none" stroke="rgba(56,178,245,0.055)" strokeWidth="1"/>
          </pattern>
          <radialGradient id="glow1" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(56,178,245,0.04)"/>
            <stop offset="100%" stopColor="transparent"/>
          </radialGradient>
          <radialGradient id="glow2" cx="50%" cy="0%" r="50%">
            <stop offset="0%" stopColor="rgba(247,201,72,0.05)"/>
            <stop offset="100%" stopColor="transparent"/>
          </radialGradient>
        </defs>
        <rect width="1000" height="700" fill="url(#grid)"/>
        <rect width="1000" height="700" fill="url(#glow1)"/>
        <rect width="1000" height="700" fill="url(#glow2)"/>
        {/* Sine wave */}
        <path d="M0 380 Q80 260 160 380 Q240 500 320 380 Q400 260 480 380 Q560 500 640 380 Q720 260 800 380 Q880 500 1000 380"
          fill="none" stroke="rgba(67,233,123,0.11)" strokeWidth="2.5" strokeDasharray="7,4"/>
        {/* Euler box */}
        <rect x="400" y="30" width="200" height="44" rx="10" fill="rgba(247,201,72,0.07)" stroke="rgba(247,201,72,0.25)" strokeWidth="1.2"/>
        <text x="414" y="56" fontSize="18" fill="rgba(247,201,72,0.6)" fontFamily="monospace" fontWeight="bold">e^(iπ) + 1 = 0</text>
        {/* Taylor series */}
        <text x="560" y="620" fontSize="12" fill="rgba(67,233,123,0.22)" fontFamily="monospace">eˣ = Σ(n=0→∞) xⁿ/n!</text>
        {/* Pi approximation strip */}
        <text x="0" y="18" fontSize="11" fill="rgba(247,201,72,0.12)" fontFamily="monospace">π ≈ 3.14159265358979323846264338327950288...</text>
        {/* Bell curve */}
        <path d="M760 520 Q790 518 820 512 Q840 505 870 440 Q900 505 920 512 Q950 518 980 520"
          fill="rgba(56,178,245,0.06)" stroke="rgba(56,178,245,0.25)" strokeWidth="2"/>
        <text x="768" y="540" fontSize="10" fill="rgba(56,178,245,0.25)" fontFamily="monospace">Normal Dist.</text>
      </svg>

      {/* Atom top-right */}
      <div className="atom" style={{ width:180, height:180, top:'6%', right:'-20px', opacity:.3 }}>
        <div className="nucleus" style={{ background:'var(--blue)', boxShadow:'0 0 12px var(--blue)' }}/>
        <div className="orbit o1"><div className="electron"/></div>
        <div className="orbit o2"><div className="electron e2"/></div>
        <div className="orbit o3"><div className="electron e3"/></div>
      </div>

      {/* Atom bottom-left */}
      <div className="atom" style={{ width:110, height:110, bottom:'10%', left:'-15px', opacity:.22 }}>
        <div className="nucleus" style={{ background:'var(--accent)', boxShadow:'0 0 12px var(--accent)' }}/>
        <div className="orbit o1"><div className="electron"/></div>
        <div className="orbit o2"><div className="electron e2"/></div>
      </div>

      {/* Floating symbols */}
      {['∑','π','⚛','∫','Δ','λ','∞','√','⚗','θ'].map((sym, i) => (
        <span
          key={i}
          className="absolute text-2xl font-bold pointer-events-none select-none"
          style={{
            color: `rgba(56,178,245,${0.08 + (i % 3) * 0.04})`,
            animation: `floatSym ${6 + (i % 3)}s ease-in-out ${i * 0.5}s infinite`,
            top:  ['8%','15%','22%','45%','60%','70%','75%','10%','35%','55%'][i],
            left: i % 2 === 0 ? `${5 + i * 3}%` : undefined,
            right:i % 2 !== 0 ? `${5 + i * 2}%` : undefined,
          }}
        >
          {sym}
        </span>
      ))}

      {/* Floating math formula cards */}
      <div className="math-card mc1">
        <div style={{ fontSize:'.6rem', letterSpacing:'.8px', textTransform:'uppercase', marginBottom:3, fontWeight:600, color:'rgba(255,107,107,.6)' }}>Complex Number</div>
        <div style={{ fontFamily:'Georgia,serif', fontSize:'1.05rem', fontWeight:700 }}>i = √<span style={{ textDecoration:'overline' }}>−1</span></div>
        <div style={{ fontSize:'.6rem', marginTop:3, opacity:.7, fontFamily:'monospace' }}>i² = −1 · i⁴ = 1</div>
      </div>
      <div className="math-card mc3">
        <div style={{ fontSize:'.6rem', letterSpacing:'.8px', textTransform:'uppercase', marginBottom:3, fontWeight:600, color:'rgba(247,201,72,.65)' }}>Euler's Identity</div>
        <div style={{ fontFamily:'Georgia,serif', fontSize:'1.05rem', fontWeight:700 }}>e<sup>iπ</sup> + 1 = 0</div>
        <div style={{ fontSize:'.6rem', marginTop:3, opacity:.7, fontFamily:'monospace' }}>Most beautiful eq.</div>
      </div>
      <div className="math-card mc5">
        <div style={{ fontSize:'.6rem', letterSpacing:'.8px', textTransform:'uppercase', marginBottom:3, fontWeight:600, color:'rgba(67,233,123,.55)' }}>Derivative</div>
        <div style={{ fontFamily:'Georgia,serif', fontSize:'1.05rem', fontWeight:700 }}>d/dx[xⁿ] = nxⁿ⁻¹</div>
        <div style={{ fontSize:'.6rem', marginTop:3, opacity:.7, fontFamily:'monospace' }}>(f∘g)' = f'(g)·g'</div>
      </div>

      {/* DNA helix */}
      <div className="absolute flex flex-col gap-4 opacity-[.18] pointer-events-none" style={{ right:'12%', top:'28%' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="dna-pair" style={{ animation: `dnaWave 3s ease-in-out ${i * 0.25}s infinite` }}/>
        ))}
      </div>
    </div>
  )
}
