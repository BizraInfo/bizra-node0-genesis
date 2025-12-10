"use client"

export function SolutionSection() {
  return (
    <section id="solution" className="py-24 px-8">
      <div className="container max-w-7xl mx-auto">
        <div className="section-header text-center mb-16 fade-in">
          <div className="section-badge inline-block bg-[rgba(212,175,55,0.1)] border border-[#D4AF37] text-[#D4AF37] px-4 py-2 rounded-full text-sm font-600 mb-4 uppercase tracking-wider">
            The Solution
          </div>
          <h2 className="section-title text-4xl md:text-6xl font-800 mb-6 text-white">
            BIZRA OS: AI That Rewards Impact
          </h2>
          <p className="section-subtitle text-xl text-[rgba(255,255,255,0.7)] max-w-3xl mx-auto leading-relaxed">
            The world's first Dual-Agentic Operating System with Proof-of-Impact economy and BlockGraph consensus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 fade-in bg-[rgba(255,255,255,0.05)] backdrop-blur-10 border border-[rgba(212,175,55,0.2)] rounded-3xl hover:bg-[rgba(255,255,255,0.08)] hover:border-[#D4AF37] transition-all duration-400 hover:transform hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(212,175,55,0.15)]">
            <div className="solution-icon w-16 h-16 mb-6">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[#D4AF37] fill-none stroke-1">
                <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                <path d="M2 17L12 22L22 17"/>
                <path d="M2 12L12 17L22 12"/>
              </svg>
            </div>
            <h3 className="solution-title text-2xl font-700 mb-4 text-white">Dual-Agentic Architecture</h3>
            <p className="solution-description text-[rgba(255,255,255,0.7)] leading-relaxed">
              Personal agents serve YOU (privacy-first, local control). System agents manage the network (consensus, economy). Zero lateral bypass via SIAP protocol.
            </p>
          </div>

          <div className="glass-card p-8 fade-in bg-[rgba(255,255,255,0.05)] backdrop-blur-10 border border-[rgba(212,175,55,0.2)] rounded-3xl hover:bg-[rgba(255,255,255,0.08)] hover:border-[#D4AF37] transition-all duration-400 hover:transform hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(212,175,55,0.15)]">
            <div className="solution-icon w-16 h-16 mb-6">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[#D4AF37] fill-none stroke-1">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6V12L16 14"/>
                <path d="M8 12L10 14L12 12L14 14L16 12"/>
              </svg>
            </div>
            <h3 className="solution-title text-2xl font-700 mb-4 text-white">Proof-of-Impact (PoI)</h3>
            <p className="solution-description text-[rgba(255,255,255,0.7)] leading-relaxed">
              Every action measured. Every contribution verified. Every impact rewarded. Earn SEED tokens for real-world good deeds with cryptographic proof.
            </p>
          </div>

          <div className="glass-card p-8 fade-in bg-[rgba(255,255,255,0.05)] backdrop-blur-10 border border-[rgba(212,175,55,0.2)] rounded-3xl hover:bg-[rgba(255,255,255,0.08)] hover:border-[#D4AF37] transition-all duration-400 hover:transform hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(212,175,55,0.15)]">
            <div className="solution-icon w-16 h-16 mb-6">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[#D4AF37] fill-none stroke-1">
                <path d="M3 3H21V21H3V3Z"/>
                <path d="M9 3V21"/>
                <path d="M15 3V21"/>
                <path d="M3 9H21"/>
                <path d="M3 15H21"/>
                <circle cx="6" cy="6" r="1" fill="#D4AF37"/>
                <circle cx="12" cy="12" r="1" fill="#D4AF37"/>
                <circle cx="18" cy="18" r="1" fill="#D4AF37"/>
              </svg>
            </div>
            <h3 className="solution-title text-2xl font-700 mb-4 text-white">BlockGraph DAG</h3>
            <p className="solution-description text-[rgba(255,255,255,0.7)] leading-relaxed">
              Not a blockchain—a Directed Acyclic Graph. Sub-8-second finality. Weighted-Quorum References. SHA-256/BLAKE3 security. Genesis verified.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
