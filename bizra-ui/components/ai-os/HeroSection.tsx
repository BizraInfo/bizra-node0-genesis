"use client"

import { Button } from "@/components/ui/button"
import { BilingualText } from "./BilingualText"
import { bilingualContent } from "@/lib/i18n"

export function HeroSection() {
  return (
    <section className="min-h-screen flex items-center justify-center px-8 py-32 text-center">
      <div className="max-w-[1000px] mx-auto">
        <div className="inline-block bg-[rgba(212,175,55,0.1)] border border-[#D4AF37] text-[#D4AF37] px-6 py-2.5 rounded-[50px] text-[0.9rem] font-semibold mb-8 animate-[pulse-gold_3s_ease-in-out_infinite]">
          <BilingualText {...bilingualContent.hero.badge} />
        </div>
        <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[1.1] mb-6 bg-gradient-to-br from-white to-[#D4AF37] bg-clip-text text-transparent">
          {bilingualContent.hero.title.en}
        </h1>
        <p className="text-[clamp(1.2rem,2.5vw,1.8rem)] text-[rgba(255,255,255,0.7)] mb-12 font-light">
          {bilingualContent.hero.subtitle.en}
        </p>
        <div className="flex gap-6 justify-center flex-wrap">
          <a href="#alpha-100">
            <Button size="lg" className="bg-[#D4AF37] text-[#0A1828] hover:bg-transparent hover:text-[#D4AF37] border-2 border-[#D4AF37] rounded-[50px] px-12 py-4 text-[1.1rem] font-bold transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(212,175,55,0.3)]">
              <BilingualText {...bilingualContent.hero.ctaPrimary} />
            </Button>
          </a>
          <a href="#proof">
            <Button variant="outline" size="lg" className="bg-transparent text-[rgba(255,255,255,0.95)] border border-[rgba(212,175,55,0.2)] rounded-[50px] px-12 py-4 text-[1.1rem] font-semibold transition-all hover:border-[#D4AF37] hover:text-[#D4AF37] hover:-translate-y-1">
              <BilingualText {...bilingualContent.hero.ctaSecondary} />
            </Button>
          </a>
        </div>
      </div>
    </section>
  )
}

