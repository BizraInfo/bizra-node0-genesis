"use client"

import { useEffect, useState } from "react"
import { VantaBackground } from "@/components/terminal/VantaBackground"
import { SacredGeometryOverlay } from "@/components/terminal/SacredGeometryOverlay"
import { TerminalNavigation } from "@/components/terminal/Navigation"
import { TerminalHero } from "@/components/terminal/Hero"
import { ProblemSection } from "@/components/terminal/ProblemSection"
import { SolutionSection } from "@/components/terminal/SolutionSection"
import { ProofSection } from "@/components/terminal/ProofSection"
import { Alpha100Section } from "@/components/terminal/Alpha100Section"
import { TerminalFooter } from "@/components/terminal/Footer"
import { BlockchainStatus } from "@/components/terminal/BlockchainStatus"

export function TerminalLandingPage() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <main className={`min-h-screen bg-[#0A1828] text-[rgba(255,255,255,0.95)] relative overflow-x-hidden ${isLoaded ? 'loading' : ''}`}>
      <VantaBackground />
      <SacredGeometryOverlay />

      <div className="relative z-[2]">
        <TerminalNavigation />
        <TerminalHero />
        <ProblemSection />
        <SolutionSection />
        <ProofSection />
        <Alpha100Section />
        <TerminalFooter />
        <BlockchainStatus />
      </div>
    </main>
  )
}
