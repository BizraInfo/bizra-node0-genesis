"use client"

export function ProblemSection() {
  return (
    <section id="problem" className="py-24 px-8">
      <div className="container max-w-7xl mx-auto">
        <div className="section-header text-center mb-16 fade-in">
          <div className="section-badge inline-block bg-[rgba(212,175,55,0.1)] border border-[#D4AF37] text-[#D4AF37] px-4 py-2 rounded-full text-sm font-600 mb-4 uppercase tracking-wider">
            The Crisis
          </div>
          <h2 className="section-title text-4xl md:text-6xl font-800 mb-6 text-white">
            The World is in Pain
          </h2>
          <p className="section-subtitle text-xl text-[rgba(255,255,255,0.7)] max-w-3xl mx-auto leading-relaxed">
            While 305 million people face humanitarian crises, we have the technology to help—but no system to coordinate it.
          </p>
        </div>

        <div className="crisis-stats grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card stat-card text-center p-8 fade-in bg-[rgba(255,255,255,0.05)] backdrop-blur-10 border border-[rgba(212,175,55,0.2)] rounded-3xl">
            <div className="stat-number text-6xl font-800 text-[#D4AF37] leading-none mb-4">305M</div>
            <div className="stat-label text-lg text-[rgba(255,255,255,0.7)] font-500">People in Humanitarian Crisis</div>
          </div>
          <div className="glass-card stat-card text-center p-8 fade-in bg-[rgba(255,255,255,0.05)] backdrop-blur-10 border border-[rgba(212,175,55,0.2)] rounded-3xl">
            <div className="stat-number text-6xl font-800 text-[#D4AF37] leading-none mb-4">$47B</div>
            <div className="stat-label text-lg text-[rgba(255,255,255,0.7)] font-500">Annual Funding Gap</div>
          </div>
          <div className="glass-card stat-card text-center p-8 fade-in bg-[rgba(255,255,255,0.05)] backdrop-blur-10 border border-[rgba(212,175,55,0.2)] rounded-3xl">
            <div className="stat-number text-6xl font-800 text-[#D4AF37] leading-none mb-4">0%</div>
            <div className="stat-label text-lg text-[rgba(255,255,255,0.7)] font-500">AI Systems Rewarding Good Deeds</div>
          </div>
        </div>
      </div>
    </section>
  )
}
