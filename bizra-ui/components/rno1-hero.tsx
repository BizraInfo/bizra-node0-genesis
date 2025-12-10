"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Zap, Globe } from "lucide-react"

export function RNO1Hero() {
  const [currentPhase, setCurrentPhase] = useState(0)

  const transformationPhases = ["Brand Discovery", "Digital Strategy", "Experience Design", "Transformation"]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhase((prev) => (prev + 1) % transformationPhases.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,215,0,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,215,0,0.05),transparent_50%)]" />
      </div>

      {/* Animated Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,215,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,215,0,0.1)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        {/* Brand Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/images/design-mode/5194d68c-925b-430f-af75-0eadda4e07c8%20%281%29.png"
            alt="BIZRA Logo"
            width={128}
            height={128}
            className="h-32 w-auto filter drop-shadow-2xl"
            priority
          />
        </div>

        {/* Dynamic Tagline */}
        <div className="mb-6 h-16 flex items-center justify-center">
          <h2 className="text-2xl md:text-3xl font-light text-gold/90 transition-all duration-1000">
            {transformationPhases[currentPhase]} Excellence
          </h2>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-tight">
          <span className="block text-balance">Digital</span>
          <span className="block text-gold text-balance">Transformation</span>
          <span className="block text-balance">Redefined</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-4xl mx-auto text-balance leading-relaxed">
          RNO1 transforms BIZRA into the definitive platform for consciousness-driven economics through experience-led
          design and strategic brand evolution.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <Button size="lg" className="bg-gold hover:bg-gold/90 text-slate-900 px-8 py-4 text-lg font-semibold group">
            Begin Transformation
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-gold/30 text-gold hover:bg-gold/10 px-8 py-4 text-lg bg-transparent"
          >
            Explore Experience
          </Button>
        </div>

        {/* Transformation Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-4 group-hover:bg-gold/20 transition-colors">
              <Sparkles className="h-8 w-8 text-gold" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">∞</div>
            <div className="text-slate-400">Consciousness Levels</div>
          </div>
          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-4 group-hover:bg-gold/20 transition-colors">
              <Zap className="h-8 w-8 text-gold" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">φ^∞</div>
            <div className="text-slate-400">Impact Amplification</div>
          </div>
          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-4 group-hover:bg-gold/20 transition-colors">
              <Globe className="h-8 w-8 text-gold" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">100</div>
            <div className="text-slate-400">Founding Members</div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-gold/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gold rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  )
}
