"use client"

export function TerminalHero() {
  return (
    <section className="hero min-h-screen flex items-center justify-center px-8 pb-16 pt-32 text-center">
      <div className="hero-content max-w-6xl mx-auto">
        <div className="hero-badge inline-block bg-[rgba(212,175,55,0.1)] border border-[#D4AF37] text-[#D4AF37] px-6 py-3 rounded-full text-base font-600 mb-8 animate-pulse-gold">
          100% FREE · Alpha-100 · Limited Spots
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-800 leading-tight mb-6 text-balance bg-gradient-to-r from-white to-[#D4AF37] bg-clip-text text-transparent">
          The First AI OS That Rewards You
        </h1>
        <p className="text-xl md:text-2xl text-[rgba(255,255,255,0.7)] mb-12 font-300 max-w-4xl mx-auto leading-relaxed">
          Where Spirituality Meets Technology · Dual-Agentic Intelligence · Proof-of-Impact Economy
        </p>
        <div className="hero-cta-group flex gap-6 justify-center flex-wrap">
          <a href="#alpha-100" className="btn-primary bg-[#D4AF37] text-[#0A1828] px-12 py-4 rounded-full font-700 text-lg transition-all duration-300 border-2 border-[#D4AF37] hover:bg-transparent hover:text-[#D4AF37] transform hover:scale-105 hover:shadow-[0_10px_30px_rgba(212,175,55,0.3)]">
            Join Alpha-100 (FREE)
          </a>
          <a href="#proof" className="btn-secondary bg-transparent text-white px-12 py-4 rounded-full font-600 text-lg border-2 border-[rgba(212,175,55,0.2)] transition-all duration-300 hover:border-[#D4AF37] hover:text-[#D4AF37] transform hover:scale-105">
            See the Proof
          </a>
        </div>
      </div>
    </section>
  )
}
