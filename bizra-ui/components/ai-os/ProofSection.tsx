"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { BilingualText } from "./BilingualText"
import { PerformanceChart } from "./PerformanceChart"
import { bilingualContent } from "@/lib/i18n"

const proofItems = [
  {
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[#D4AF37] fill-none stroke-2">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    title: "Genesis Block Verified",
    description: "Root hash cryptographically proven and immutable.",
    hash: "d9c9fa504add65a1be737f3fe3447bc056fd1aad2850f491184208354f41926f",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[#D4AF37] fill-none stroke-2">
        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    title: "35/35 Tests Passing",
    description: "Comprehensive test suite covering all critical paths. Zero failures in production validation.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[#D4AF37] fill-none stroke-2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1V3" />
        <path d="M12 21V23" />
        <path d="M4.22 4.22L5.64 5.64" />
        <path d="M18.36 18.36L19.78 19.78" />
        <path d="M1 12H3" />
        <path d="M21 12H23" />
        <path d="M4.22 19.78L5.64 18.36" />
        <path d="M18.36 5.64L19.78 4.22" />
      </svg>
    ),
    title: "1.9GB AI Models Trained",
    description: "7 Trading Giants agents (Buffett, Lynch, Soros, Simons, Dalio + Risk/Portfolio) ready for GPU deployment.",
  },
]

export function ProofSection() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    // Fetch stats from blockchain API
    fetch("/api/blockchain/stats")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setStats(data)
        }
      })
      .catch(() => {
        // Use default stats if API unavailable
        setStats(null)
      })
  }, [])

  return (
    <section id="proof" className="py-24 px-8 relative">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block bg-[rgba(212,175,55,0.1)] border border-[#D4AF37] text-[#D4AF37] px-5 py-2 rounded-[50px] text-[0.85rem] font-semibold mb-4 uppercase tracking-[1px]">
            <BilingualText {...bilingualContent.sections.proof.badge} />
          </div>
          <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-extrabold mb-4 text-white">
            {bilingualContent.sections.proof.title.en}
          </h2>
          <p className="text-[clamp(1rem,2vw,1.3rem)] text-[rgba(255,255,255,0.7)] max-w-[700px] mx-auto">
            {bilingualContent.sections.proof.subtitle.en}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {proofItems.map((item, index) => (
            <Card
              key={index}
              className="p-6 bg-[rgba(255,255,255,0.05)] backdrop-blur-[10px] border border-[rgba(212,175,55,0.2)] rounded-[20px] flex items-start gap-4"
            >
              <div className="w-10 h-10 flex-shrink-0">{item.icon}</div>
              <div className="flex-1">
                <h3 className="text-[1.2rem] font-bold mb-2 text-white">{item.title}</h3>
                <p className="text-[0.95rem] text-[rgba(255,255,255,0.7)] leading-relaxed">{item.description}</p>
                {item.hash && (
                  <div className="font-mono bg-[rgba(212,175,55,0.1)] border border-[#D4AF37] p-4 rounded-[10px] break-all text-[0.85rem] text-[#D4AF37] mt-2">
                    {item.hash}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-8 bg-[rgba(255,255,255,0.05)] backdrop-blur-[10px] border border-[rgba(212,175,55,0.2)] rounded-[20px] mt-12">
          <h3 className="text-center mb-8 text-[1.8rem] font-bold">System Performance Metrics</h3>
          <div className="h-[400px]">
            <PerformanceChart stats={stats} />
          </div>
        </Card>
      </div>
    </section>
  )
}

