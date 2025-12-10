"use client"

export function TerminalFooter() {
  return (
    <footer className="py-12 px-8 border-t border-[rgba(212,175,55,0.2)] text-center">
      <div className="footer-content max-w-7xl mx-auto">
        <div className="footer-logo text-3xl font-800 text-[#D4AF37] mb-4">
          BIZRA <span className="text-sm opacity-80">بذرة</span>
        </div>
        <div className="footer-tagline text-[rgba(255,255,255,0.7)] mb-8 italic">
          "Every human is a node. Every node is a seed. Every seed holds infinite potential."
        </div>

        <div className="footer-links flex justify-center gap-8 flex-wrap mb-8">
          <a href="#problem" className="text-[rgba(255,255,255,0.7)] hover:text-[#D4AF37] transition-colors duration-300">The Crisis</a>
          <a href="#solution" className="text-[rgba(255,255,255,0.7)] hover:text-[#D4AF37] transition-colors duration-300">Solution</a>
          <a href="#proof" className="text-[rgba(255,255,255,0.7)] hover:text-[#D4AF37] transition-colors duration-300">Proof</a>
          <a href="#alpha-100" className="text-[rgba(255,255,255,0.7)] hover:text-[#D4AF37] transition-colors duration-300">Join Alpha-100</a>
          <a href="mailto:m.beshr@bizra.info" className="text-[rgba(255,255,255,0.7)] hover:text-[#D4AF37] transition-colors duration-300">Contact</a>
        </div>

        <div className="footer-copyright text-[rgba(255,255,255,0.5)] text-sm">
          &copy; 2025 BIZRA. Where Spirituality Meets Technology.
        </div>
      </div>
    </footer>
  )
}
