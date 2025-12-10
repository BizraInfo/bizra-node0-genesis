"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play, Pause } from "lucide-react"

export function AKQAHero() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentPhase, setCurrentPhase] = useState(0)

  const phases = ["STRATEGY", "INNOVATION", "TRANSFORMATION", "IMPACT"]

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentPhase((prev) => (prev + 1) % phases.length)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [isPlaying, phases.length])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* AKQA Signature Interactive Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />

        {/* Dynamic Grid System */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-12 grid-rows-8 h-full w-full">
            {Array.from({ length: 96 }).map((_, i) => (
              <div
                key={i}
                className={`border border-primary/10 transition-all duration-1000 ${
                  i % 4 === currentPhase ? "bg-primary/5 border-primary/30" : ""
                }`}
                style={{
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Floating Strategic Elements */}
        <div className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-accent rounded-full opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        {/* AKQA Brand Signature */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-full">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            <span className="text-sm font-mono text-muted-foreground tracking-wider">
              AKQA × BIZRA STRATEGIC ALLIANCE
            </span>
          </div>
        </div>

        {/* Dynamic Phase Display */}
        <div className="mb-12">
          <h1 className="text-8xl md:text-9xl font-bold text-primary mb-4 tracking-tight">{phases[currentPhase]}</h1>
          <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-accent to-transparent" />
        </div>

        {/* Strategic Messaging */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-serif text-balance mb-6">
            The Future of Human-Centered
            <span className="text-accent"> Economic Systems</span>
          </h2>
          <p className="text-xl text-muted-foreground text-pretty leading-relaxed">
            AKQA presents BIZRA: Where advanced strategy meets immersive technology to create the world's first
            Proof-of-Impact economic ecosystem. Experience the convergence of human consciousness and digital
            transformation.
          </p>
        </div>

        {/* Interactive Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Button
            size="lg"
            className="group px-8 py-4 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Enter the Ecosystem
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-8 py-4 text-lg border-primary/30 hover:bg-primary/10"
          >
            {isPlaying ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
            {isPlaying ? "Pause Experience" : "Play Experience"}
          </Button>
        </div>

        {/* Strategic Metrics */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { label: "Strategic Depth", value: "∞", unit: "Layers" },
            { label: "Impact Verification", value: "100", unit: "% Transparent" },
            { label: "User Experience", value: "7", unit: "Personal Agents" },
            { label: "Economic Innovation", value: "2", unit: "Token System" },
          ].map((metric, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">
                {metric.value}
                <span className="text-lg text-muted-foreground ml-1">{metric.unit}</span>
              </div>
              <div className="text-sm text-muted-foreground">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </section>
  )
}
