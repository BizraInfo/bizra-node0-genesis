"use client"

import { useEffect, useState } from "react"
import { MapPin, Users, Zap, TrendingUp } from "lucide-react"

export function GlobalImpact() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const metrics = [
    { icon: Users, value: "100", label: "Founding Members", suffix: "" },
    { icon: MapPin, value: "50", label: "Global Cities", suffix: "+" },
    { icon: Zap, value: "1M", label: "Impact Points", suffix: "+" },
    { icon: TrendingUp, value: "∞", label: "Consciousness Level", suffix: "" },
  ]

  return (
    <section className="py-32 bg-card/30">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-serif font-light mb-6 text-balance">Global Transformation</h2>
          <div className="w-24 h-px bg-primary mx-auto mb-8"></div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            BIZRA's impact transcends borders, creating a worldwide network of consciousness-driven economic activity
            that benefits all of humanity.
          </p>
        </div>

        {/* Impact metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className={`text-center transition-all duration-1000 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <metric.icon className="w-8 h-8 text-primary" />
              </div>
              <div className="text-4xl font-serif font-light text-primary mb-2">
                {metric.value}
                {metric.suffix}
              </div>
              <div className="text-sm text-muted-foreground font-mono tracking-wider uppercase">{metric.label}</div>
            </div>
          ))}
        </div>

        {/* Global vision */}
        <div className={`transition-all duration-1000 delay-1000 ${mounted ? "opacity-100" : "opacity-0"}`}>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-3xl font-serif font-light mb-6">Worldwide Network</h3>
                <p className="text-muted-foreground mb-6 text-pretty leading-relaxed">
                  From Silicon Valley to Singapore, from London to Lagos, BIZRA connects impact creators across
                  continents, cultures, and communities.
                </p>
                <p className="text-muted-foreground text-pretty leading-relaxed">
                  Our platform transcends geographical boundaries, creating a unified ecosystem where meaningful work is
                  recognized and rewarded globally.
                </p>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-serif font-light text-primary mb-2">∞</div>
                    <div className="text-sm font-mono tracking-wider text-muted-foreground uppercase">
                      Infinite Potential
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-primary animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 rounded-full bg-accent animate-pulse delay-500"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
