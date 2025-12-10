"use client"

import { useEffect, useState } from "react"
import { Heart, Globe2, Lightbulb, Users2 } from "lucide-react"

export function CulturalSymbol() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="py-32 bg-card/50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-serif font-light mb-6 text-balance">Cultural Symbol</h2>
          <div className="w-24 h-px bg-primary mx-auto mb-8"></div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            BIZRA transcends technology to become a cultural symbol representing humanity's evolution toward
            consciousness-based economics and meaningful impact.
          </p>
        </div>

        {/* Symbol elements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <div
            className={`transition-all duration-1000 ${mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}
          >
            <h3 className="text-3xl font-serif font-light mb-8">The BIZRA Symbol</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Heart className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium mb-2">Consciousness</h4>
                  <p className="text-muted-foreground text-sm text-pretty">
                    Represents the awakening of human awareness to our interconnected impact
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Globe2 className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium mb-2">Unity</h4>
                  <p className="text-muted-foreground text-sm text-pretty">
                    Symbolizes the global network of individuals working toward collective progress
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Lightbulb className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium mb-2">Innovation</h4>
                  <p className="text-muted-foreground text-sm text-pretty">
                    Embodies the revolutionary approach to measuring and rewarding human value
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Users2 className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-medium mb-2">Evolution</h4>
                  <p className="text-muted-foreground text-sm text-pretty">
                    Signifies humanity's next step toward a more conscious and equitable future
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`transition-all duration-1000 delay-500 ${mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
          >
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20"></div>
              <div className="absolute inset-8 rounded-full bg-gradient-to-br from-primary/10 to-accent/10"></div>
              <div className="absolute inset-16 rounded-full bg-gradient-to-br from-primary/5 to-accent/5"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl font-serif font-light text-primary mb-4">B</div>
                  <div className="text-sm font-mono tracking-widest text-muted-foreground uppercase">
                    Seed of Change
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cultural impact statement */}
        <div className={`transition-all duration-1000 delay-1000 ${mounted ? "opacity-100" : "opacity-0"}`}>
          <div className="text-center">
            <blockquote className="text-3xl md:text-4xl font-serif font-light text-primary italic max-w-5xl mx-auto text-balance mb-8">
              "When people see BIZRA, they don't just see a platform—they see the future of human potential."
            </blockquote>
            <cite className="text-sm font-mono tracking-wider text-muted-foreground uppercase">
              — Pentagram Design Philosophy
            </cite>
          </div>
        </div>
      </div>
    </section>
  )
}
