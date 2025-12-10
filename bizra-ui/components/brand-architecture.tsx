"use client"

import { useEffect, useState } from "react"
import { Layers3, Palette, Type, Grid3X3 } from "lucide-react"

export function BrandArchitecture() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const elements = [
    {
      icon: Type,
      title: "Typography",
      description: "Serif for elegance, Sans for clarity",
      details: "Playfair Display + Inter",
    },
    {
      icon: Palette,
      title: "Color System",
      description: "Sacred geometry inspired palette",
      details: "Navy, Gold, Teal accents",
    },
    {
      icon: Grid3X3,
      title: "Grid System",
      description: "Golden ratio proportions",
      details: "φ (1.618) based layouts",
    },
    {
      icon: Layers3,
      title: "Visual Hierarchy",
      description: "Consciousness-driven structure",
      details: "Progressive disclosure",
    },
  ]

  return (
    <section className="py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-serif font-light mb-6 text-balance">Brand Architecture</h2>
          <div className="w-24 h-px bg-primary mx-auto mb-8"></div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Every element of BIZRA's visual identity is carefully crafted to create a cohesive system that scales across
            all touchpoints and applications.
          </p>
        </div>

        {/* Architecture elements */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {elements.map((element, index) => (
            <div
              key={element.title}
              className={`text-center transition-all duration-1000 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <element.icon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-serif font-light mb-3">{element.title}</h3>
              <p className="text-muted-foreground text-sm mb-3 text-pretty">{element.description}</p>
              <div className="text-xs font-mono tracking-wider text-primary uppercase">{element.details}</div>
            </div>
          ))}
        </div>

        {/* System showcase */}
        <div className={`transition-all duration-1000 delay-1000 ${mounted ? "opacity-100" : "opacity-0"}`}>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Logo variations */}
              <div className="bg-card/30 p-8 rounded-lg text-center">
                <h4 className="text-lg font-serif font-light mb-6">Logo System</h4>
                <div className="space-y-4">
                  <div className="text-4xl font-serif font-light text-primary">BIZRA</div>
                  <div className="text-2xl font-serif font-light text-primary">B</div>
                  <div className="w-8 h-8 rounded-full bg-primary mx-auto"></div>
                </div>
              </div>

              {/* Color palette */}
              <div className="bg-card/30 p-8 rounded-lg text-center">
                <h4 className="text-lg font-serif font-light mb-6">Color Palette</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="aspect-square rounded bg-[#0b1420]"></div>
                  <div className="aspect-square rounded bg-[#d4af37]"></div>
                  <div className="aspect-square rounded bg-[#18b4c3]"></div>
                  <div className="aspect-square rounded bg-[#12121a]"></div>
                  <div className="aspect-square rounded bg-[#e5c687]"></div>
                  <div className="aspect-square rounded bg-[#1a1a2e]"></div>
                </div>
              </div>

              {/* Typography */}
              <div className="bg-card/30 p-8 rounded-lg text-center">
                <h4 className="text-lg font-serif font-light mb-6">Typography</h4>
                <div className="space-y-3">
                  <div className="text-2xl font-serif font-light">Playfair</div>
                  <div className="text-lg font-sans">Inter Regular</div>
                  <div className="text-sm font-mono tracking-wider">MONO CAPS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
