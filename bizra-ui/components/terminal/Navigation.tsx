"use client"

export function TerminalNavigation() {
  return (
    <nav className="fixed top-0 w-full z-100 bg-[rgba(10,24,40,0.8)] backdrop-blur-20 border-b border-[rgba(212,175,55,0.2)]">
      <div className="nav-container max-w-[1400px] mx-auto px-8 py-6 flex justify-between items-center">
        <div className="logo-container flex items-center gap-4">
          <div className="logo-text flex flex-col items-start">
            <div className="logo-main text-3xl font-800 text-[#D4AF37] tracking-[2px] leading-none">BIZRA</div>
            <div className="logo-arabic text-sm text-[rgba(255,255,255,0.7)] mt-1">بذرة</div>
          </div>
        </div>
        <a href="#alpha-100" className="nav-cta bg-[#D4AF37] text-[#0A1828] px-8 py-3 rounded-full font-700 text-base transition-all duration-300 border-2 border-[#D4AF37] hover:bg-transparent hover:text-[#D4AF37] transform hover:scale-105">
          Join Alpha-100
        </a>
      </div>
    </nav>
  )
}
