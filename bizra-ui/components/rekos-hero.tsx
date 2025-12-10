"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Zap, Layers } from "lucide-react"

export function RekosHero() {
  const [currentPhase, setCurrentPhase] = useState(0)

  const phases = [
    { icon: Sparkles, text: "Innovative Digital Products", color: "text-primary" },
    { icon: Zap, text: "Creative Branding Solutions", color: "text-accent" },
    { icon: Layers, text: "Web Development Excellence", color: "text-secondary-foreground" },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhase((prev) => (prev + 1) % phases.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Innovative Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* BIZRA Logo Integration */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
        <img
          src="/images/design-mode/5194d68c-925b-430f-af75-0eadda4e07c8%20%281%29.png"
          alt="BIZRA Logo"
          className="w-32 h-32 object-contain opacity-90 animate-seed-grow font-bold text-base text-left"
        />
      </div>

      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Dynamic Phase Display */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            {phases.map((phase, index) => {
              const Icon = phase.icon
              return (
                <div
                  key={index}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full border transition-all duration-500 ${
                    index === currentPhase ? "border-primary bg-primary/10 scale-110" : "border-muted bg-muted/5"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${index === currentPhase ? phase.color : "text-muted-foreground"}`} />
                  <span
                    className={`text-sm font-medium ${
                      index === currentPhase ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {phase.text}
                  </span>
                </div>
              )
            })}
          </div>

          <h1 className="text-6xl md:text-8xl font-bold text-balance leading-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in-up">
              BIZRA
            </span>
            <br />
            <span className="text-4xl md:text-5xl text-foreground/90 animate-fade-in-up delay-300">
              Reimagined by Rekos
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto text-pretty animate-fade-in-up delay-500">
            Where innovative digital products meet creative branding excellence. We transform consciousness into
            compelling digital experiences that drive impact.
          </p>

          {/* Interactive Product Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 animate-fade-in-up delay-700">
            <div className="group p-6 rounded-2xl border border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 hover:scale-105">
              <Sparkles className="w-8 h-8 text-primary mb-4 group-hover:animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Digital Innovation</h3>
              <p className="text-sm text-muted-foreground">Cutting-edge products that redefine user experiences</p>
            </div>

            <div className="group p-6 rounded-2xl border border-accent/20 bg-card/50 backdrop-blur-sm hover:border-accent/40 transition-all duration-300 hover:scale-105">
              <Zap className="w-8 h-8 text-accent mb-4 group-hover:animate-bounce" />
              <h3 className="text-lg font-semibold mb-2">Creative Branding</h3>
              <p className="text-sm text-muted-foreground">Brand identities that resonate and inspire action</p>
            </div>

            <div className="group p-6 rounded-2xl border border-secondary-foreground/20 bg-card/50 backdrop-blur-sm hover:border-secondary-foreground/40 transition-all duration-300 hover:scale-105">
              <Layers className="w-8 h-8 text-secondary-foreground mb-4 group-hover:animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">Web Excellence</h3>
              <p className="text-sm text-muted-foreground">Development mastery that brings visions to life</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12 animate-fade-in-up delay-1000">
            <Button size="lg" className="group px-8 py-4 text-lg">
              Explore Innovation
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg bg-transparent">
              View Portfolio
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/3 left-10 w-4 h-4 bg-primary rounded-full animate-bounce delay-500" />
      <div className="absolute bottom-1/3 right-10 w-6 h-6 bg-accent rounded-full animate-bounce delay-1000" />
      <div className="absolute top-2/3 left-1/4 w-3 h-3 bg-secondary-foreground rounded-full animate-bounce delay-1500" />
    </section>
  )
}
