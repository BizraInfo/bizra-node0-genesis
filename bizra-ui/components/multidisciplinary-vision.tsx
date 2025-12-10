"use client"

import { useEffect, useState } from "react"
import { Layers, Palette, Code, Building } from "lucide-react"

export function MultidisciplinaryVision() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const disciplines = [
    {
      icon: Palette,
      title: "Brand Identity",
      description: "Timeless visual language that transcends digital boundaries",
      details: ["Sacred geometry integration", "Golden ratio proportions", "Cultural symbolism"],
    },
    {
      icon: Code,
      title: "Digital Experience",
      description: "Seamless interaction design across all touchpoints",
      details: ["Intuitive user journeys", "Responsive architecture", "Performance optimization"],
    },
    {
      icon: Building,
      title: "System Architecture",
      description: "Robust infrastructure for global consciousness network",
      details: ["Blockchain integration", "AI agent coordination", "Scalable verification"],
    },
    {
      icon: Layers,
      title: "Cultural Impact",
      description: "Design that shapes societal understanding of value",
      details: ["Educational frameworks", "Community building", "Legacy preservation"],
    },
  ]

  return (
    <section className="py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-serif font-light mb-6 text-balance">Multidisciplinary Excellence</h2>
          <div className="w-24 h-px bg-primary mx-auto mb-8"></div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Pentagram's approach to BIZRA integrates graphic design, digital experience, architecture, and cultural
            strategy into one cohesive vision.
          </p>
        </div>

        {/* Disciplines grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {disciplines.map((discipline, index) => (
            <div
              key={discipline.title}
              className={`transition-all duration-1000 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 300}ms` }}
            >
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <discipline.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-serif font-light mb-4">{discipline.title}</h3>
                  <p className="text-muted-foreground mb-6 text-pretty leading-relaxed">{discipline.description}</p>
                  <ul className="space-y-2">
                    {discipline.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center gap-3 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        <span className="text-muted-foreground">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Vision statement */}
        <div className="text-center mt-20">
          <div className={`transition-all duration-1000 delay-1200 ${mounted ? "opacity-100" : "opacity-0"}`}>
            <div className="max-w-4xl mx-auto p-12 border border-primary/20 rounded-lg bg-card/30">
              <h3 className="text-3xl font-serif font-light mb-6 text-primary">Our Vision</h3>
              <p className="text-lg text-muted-foreground text-pretty leading-relaxed">
                BIZRA represents the convergence of human consciousness, economic innovation, and design excellence.
                Through multidisciplinary collaboration, we create not just a platform, but a cultural movement that
                redefines how humanity measures and rewards meaningful impact.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
