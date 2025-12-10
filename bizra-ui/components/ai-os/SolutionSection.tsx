"use client"

import { Card } from "@/components/ui/card"
import { BilingualText } from "./BilingualText"
import { bilingualContent } from "@/lib/i18n"

const solutions = [
  {
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[#D4AF37] fill-none stroke-[1.5]">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" />
        <path d="M2 17L12 22L22 17" />
        <path d="M2 12L12 17L22 12" />
      </svg>
    ),
    title: "Dual-Agentic Architecture",
    description: "Personal agents serve YOU (privacy-first, local control). System agents manage the network (consensus, economy). Zero lateral bypass via SIAP protocol.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[#D4AF37] fill-none stroke-[1.5]">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6V12L16 14" />
        <path d="M8 12L10 14L12 12L14 14L16 12" />
      </svg>
    ),
    title: "Proof-of-Impact (PoI)",
    description: "Every action measured. Every contribution verified. Every impact rewarded. Earn SEED tokens for real-world good deeds with cryptographic proof.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[#D4AF37] fill-none stroke-[1.5]">
        <path d="M3 3H21V21H3V3Z" />
        <path d="M9 3V21" />
        <path d="M15 3V21" />
        <path d="M3 9H21" />
        <path d="M3 15H21" />
        <circle cx="6" cy="6" r="1" fill="#D4AF37" />
        <circle cx="12" cy="12" r="1" fill="#D4AF37" />
        <circle cx="18" cy="18" r="1" fill="#D4AF37" />
      </svg>
    ),
    title: "BlockGraph DAG",
    description: "Not a blockchain—a Directed Acyclic Graph. Sub-8-second finality. Weighted-Quorum References. SHA-256/BLAKE3 security. Genesis verified.",
  },
]

export function SolutionSection() {
  return (
    <section id="solution" className="py-24 px-8 relative">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block bg-[rgba(212,175,55,0.1)] border border-[#D4AF37] text-[#D4AF37] px-5 py-2 rounded-[50px] text-[0.85rem] font-semibold mb-4 uppercase tracking-[1px]">
            <BilingualText {...bilingualContent.sections.solution.badge} />
          </div>
          <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-extrabold mb-4 text-white">
            {bilingualContent.sections.solution.title.en}
          </h2>
          <p className="text-[clamp(1rem,2vw,1.3rem)] text-[rgba(255,255,255,0.7)] max-w-[700px] mx-auto">
            {bilingualContent.sections.solution.subtitle.en}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {solutions.map((solution, index) => (
            <Card
              key={index}
              className="p-6 bg-[rgba(255,255,255,0.05)] backdrop-blur-[10px] border border-[rgba(212,175,55,0.2)] rounded-[20px] transition-all hover:bg-[rgba(255,255,255,0.08)] hover:border-[#D4AF37] hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(212,175,55,0.15)]"
            >
              <div className="w-[60px] h-[60px] mb-6">{solution.icon}</div>
              <h3 className="text-[1.5rem] font-bold mb-4 text-white">{solution.title}</h3>
              <p className="text-[rgba(255,255,255,0.7)] leading-relaxed">{solution.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

