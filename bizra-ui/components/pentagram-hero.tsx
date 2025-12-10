"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"

export function PentagramHero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Iconic geometric background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 1200 800" fill="none">
            <circle cx="600" cy="400" r="200" stroke="currentColor" strokeWidth="1" className="text-primary/30" />
            <circle cx="600" cy="400" r="150" stroke="currentColor" strokeWidth="1" className="text-primary/20" />
            <circle cx="600" cy="400" r="100" stroke="currentColor" strokeWidth="1" className="text-primary/40" />
            <circle cx="600" cy="400" r="50" stroke="currentColor" strokeWidth="2" className="text-primary/60" />
            <circle cx="600" cy="400" r="10" fill="currentColor" className="text-primary" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Iconic BIZRA wordmark */}
        <div
          className={`mb-8 transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-8xl font-serif font-light tracking-wider text-primary">BIZRA</h1>
          </div>
          <div className="w-32 h-px bg-primary mx-auto mb-8"></div>
        </div>

        {/* Clean, powerful messaging */}
        <div
          className={`mb-12 transition-all duration-1000 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <h2 className="text-4xl md:text-6xl font-serif font-light mb-6 text-balance leading-tight">
            The Future of
            <span className="block text-primary font-normal">Human Impact</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed">
            A revolutionary operating system that transforms measurable impact into economic value, creating a new
            paradigm for human consciousness and global transformation.
          </p>
        </div>

        {/* Minimalist CTA */}
        <div
          className={`transition-all duration-1000 delay-600 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-12 py-6 text-lg font-medium rounded-full"
          >
            Begin Your Journey
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        {/* Iconic brand statement */}
        <div className={`mt-16 transition-all duration-1000 delay-900 ${mounted ? "opacity-100" : "opacity-0"}`}>
          <p className="text-sm font-mono tracking-widest text-muted-foreground uppercase">Designed by Pentagram</p>
        </div>
      </div>
    </section>
  )
}
