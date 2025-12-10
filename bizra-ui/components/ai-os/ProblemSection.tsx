"use client"

import { Card } from "@/components/ui/card"
import { BilingualText } from "./BilingualText"
import { bilingualContent } from "@/lib/i18n"

const crisisStats = [
  { number: "305M", label: "People in Humanitarian Crisis" },
  { number: "$47B", label: "Annual Funding Gap" },
  { number: "0%", label: "AI Systems Rewarding Good Deeds" },
]

export function ProblemSection() {
  return (
    <section id="problem" className="py-24 px-8 relative">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block bg-[rgba(212,175,55,0.1)] border border-[#D4AF37] text-[#D4AF37] px-5 py-2 rounded-[50px] text-[0.85rem] font-semibold mb-4 uppercase tracking-[1px]">
            <BilingualText {...bilingualContent.sections.problem.badge} />
          </div>
          <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-extrabold mb-4 text-white">
            {bilingualContent.sections.problem.title.en}
          </h2>
          <p className="text-[clamp(1rem,2vw,1.3rem)] text-[rgba(255,255,255,0.7)] max-w-[700px] mx-auto">
            {bilingualContent.sections.problem.subtitle.en}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {crisisStats.map((stat, index) => (
            <Card
              key={index}
              className="text-center p-8 bg-[rgba(255,255,255,0.05)] backdrop-blur-[10px] border border-[rgba(212,175,55,0.2)] rounded-[20px] transition-all hover:bg-[rgba(255,255,255,0.08)] hover:border-[#D4AF37] hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(212,175,55,0.15)]"
            >
              <div className="text-[3.5rem] font-extrabold text-[#D4AF37] leading-none mb-2">{stat.number}</div>
              <div className="text-base text-[rgba(255,255,255,0.7)] font-medium">{stat.label}</div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

