"use client"

export function AOSFooter() {
  return (
    <footer className="py-12 px-8 border-t border-[rgba(212,175,55,0.2)] text-center">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-[2rem] font-extrabold text-[#D4AF37] mb-4">
          BIZRA <span className="font-['Noto_Sans_Arabic',sans-serif] text-[1.2rem]">بذرة</span>
        </div>
        <div className="text-[rgba(255,255,255,0.7)] mb-8 italic">
          "Every human is a node. Every node is a seed. Every seed holds infinite potential."
        </div>

        <div className="flex justify-center gap-8 flex-wrap mb-8">
          <a href="#problem" className="text-[rgba(255,255,255,0.7)] no-underline transition-colors hover:text-[#D4AF37]">
            The Crisis
          </a>
          <a href="#solution" className="text-[rgba(255,255,255,0.7)] no-underline transition-colors hover:text-[#D4AF37]">
            Solution
          </a>
          <a href="#proof" className="text-[rgba(255,255,255,0.7)] no-underline transition-colors hover:text-[#D4AF37]">
            Proof
          </a>
          <a href="#alpha-100" className="text-[rgba(255,255,255,0.7)] no-underline transition-colors hover:text-[#D4AF37]">
            Join Alpha-100
          </a>
          <a href="mailto:m.beshr@bizra.info" className="text-[rgba(255,255,255,0.7)] no-underline transition-colors hover:text-[#D4AF37]">
            Contact
          </a>
        </div>

        <div className="text-[rgba(255,255,255,0.5)] text-[0.9rem]">
          &copy; 2025 BIZRA. Where Spirituality Meets Technology.
        </div>
      </div>
    </footer>
  )
}

