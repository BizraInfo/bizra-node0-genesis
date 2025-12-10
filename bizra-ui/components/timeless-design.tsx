"use client"

import { useEffect, useState } from "react"
import { Clock, Star, Shield, Infinity } from "lucide-react"

export function TimelessDesign() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const principles = [
    {
      icon: Clock,
      title: "Enduring",
      description: "Design that remains relevant across decades, not seasons",
    },
    {
      icon: Star,
      title: "Iconic",
      description: "Visual identity that becomes instantly recognizable worldwide",
    },
    {
      icon: Shield,
      title: "Trustworthy",
      description: "Aesthetic that conveys reliability and institutional strength",
    },
    {
      icon: Infinity,
      title: "Scalable",
      description: "Systems that grow with consciousness evolution",
    },
  ]

  return (
    <section className="py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-serif font-light mb-6 text-balance">Timeless by Nature</h2>
          <div className="w-24 h-px bg-primary mx-auto mb-8"></div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Pentagram creates design that transcends trends, establishing BIZRA as an enduring symbol of human progress
            and consciousness evolution.
          </p>
        </div>

        {/* Design principles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-20">
          {principles.map((principle, index) => (
            <div
              key={principle.title}
              className={`flex items-start gap-6 transition-all duration-1000 ${
                mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
              style={{ transitionDelay: `${index * 300}ms` }}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <principle.icon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-light mb-4">{principle.title}</h3>
                <p className="text-muted-foreground text-pretty leading-relaxed">{principle.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Timeless statement */}
        <div className={`transition-all duration-1000 delay-1200 ${mounted ? "opacity-100" : "opacity-0"}`}>
          <div className="text-center max-w-4xl mx-auto">
            <div className="p-16 border-2 border-primary/20 rounded-lg bg-card/20">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8">
                <div className="text-3xl font-serif text-primary">∞</div>
              </div>
              <h3 className="text-3xl font-serif font-light mb-6 text-primary">Legacy Design</h3>
              <p className="text-lg text-muted-foreground text-pretty leading-relaxed mb-8">
                Great design outlasts technology. BIZRA's visual identity is crafted to remain powerful and relevant as
                humanity evolves, ensuring the brand grows stronger with each generation.
              </p>
              <div className="text-sm font-mono tracking-widest text-muted-foreground uppercase">
                Designed for Eternity
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
