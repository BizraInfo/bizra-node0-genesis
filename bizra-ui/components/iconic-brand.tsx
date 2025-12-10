"use client"

import { useEffect, useState } from "react"
import { Zap, Globe, Users, TrendingUp } from "lucide-react"

export function IconicBrand() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const principles = [
    {
      icon: Zap,
      title: "Impact",
      description: "Measurable change that transforms communities and ecosystems",
    },
    {
      icon: Globe,
      title: "Global",
      description: "Worldwide network of consciousness-driven economic activity",
    },
    {
      icon: Users,
      title: "Human",
      description: "Centered on human potential and collective evolution",
    },
    {
      icon: TrendingUp,
      title: "Value",
      description: "Economic systems aligned with authentic human progress",
    },
  ]

  return (
    <section className="py-32 bg-card/50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-serif font-light mb-6 text-balance">Iconic by Design</h2>
          <div className="w-24 h-px bg-primary mx-auto mb-8"></div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            BIZRA represents more than technology—it's a cultural symbol for the evolution of human consciousness and
            economic systems.
          </p>
        </div>

        {/* Brand principles grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {principles.map((principle, index) => (
            <div
              key={principle.title}
              className={`text-center transition-all duration-1000 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <principle.icon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-serif font-light mb-4">{principle.title}</h3>
              <p className="text-muted-foreground text-pretty leading-relaxed">{principle.description}</p>
            </div>
          ))}
        </div>

        {/* Iconic statement */}
        <div className="text-center mt-20">
          <div className={`transition-all duration-1000 delay-1000 ${mounted ? "opacity-100" : "opacity-0"}`}>
            <blockquote className="text-3xl md:text-4xl font-serif font-light text-primary italic max-w-4xl mx-auto text-balance">
              "BIZRA is not just a platform—it's the symbol of humanity's next evolutionary leap."
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  )
}
