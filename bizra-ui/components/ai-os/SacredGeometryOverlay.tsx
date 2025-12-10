"use client"

export function SacredGeometryOverlay() {
  return (
    <div className="fixed top-0 left-0 w-full h-full z-[1] pointer-events-none opacity-[0.08]">
      <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] md:w-[400px] md:h-[400px]" style={{ animation: 'rotate-sacred 120s linear infinite' }} viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="flowerPattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <circle cx="100" cy="100" r="50" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.3" />
            <circle cx="150" cy="100" r="50" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.3" />
            <circle cx="125" cy="143.3" r="50" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.3" />
            <circle cx="125" cy="56.7" r="50" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.3" />
            <circle cx="75" cy="143.3" r="50" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.3" />
            <circle cx="175" cy="143.3" r="50" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.3" />
            <circle cx="50" cy="100" r="50" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="400" height="400" fill="url(#flowerPattern)" />
      </svg>
    </div>
  )
}

