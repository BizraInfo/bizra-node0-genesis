"use client"

import { VantaBackground } from "@/components/ai-os/VantaBackground"
import { SacredGeometryOverlay } from "@/components/ai-os/SacredGeometryOverlay"
import { AOSNavigation } from "@/components/ai-os/Navigation"
import { HeroSection } from "@/components/ai-os/HeroSection"
import { ProblemSection } from "@/components/ai-os/ProblemSection"
import { SolutionSection } from "@/components/ai-os/SolutionSection"
import { ProofSection } from "@/components/ai-os/ProofSection"
import { Alpha100Section } from "@/components/ai-os/Alpha100Section"
import { AOSFooter } from "@/components/ai-os/Footer"
import { BlockchainStatus } from "@/components/ai-os/BlockchainStatus"

export default function AIOSPage() {
  return (
    <main className="min-h-screen bg-[#0A1828] text-[rgba(255,255,255,0.95)] relative overflow-x-hidden">
      <VantaBackground />
      <SacredGeometryOverlay />

      <div className="relative z-[2]">
        <AOSNavigation />
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <ProofSection />
        <Alpha100Section />
        <AOSFooter />
        <BlockchainStatus />
      </div>

    </main>
  )
}

