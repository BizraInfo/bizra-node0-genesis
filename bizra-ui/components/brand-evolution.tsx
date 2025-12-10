"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Palette, Type, Layout, Zap, ArrowRight } from "lucide-react"

export function BrandEvolution() {
  const [activeEvolution, setActiveEvolution] = useState(0)

  const evolutionStages = [
    {
      icon: Palette,
      title: "Visual Identity",
      description: "Sacred geometry meets modern aesthetics",
      before: "Traditional Arabic calligraphy",
      after: "Dynamic consciousness-driven design system",
      improvements: ["Sacred geometry integration", "Golden ratio optimization", "Cultural authenticity"],
      impact: "300% brand recognition increase",
    },
    {
      icon: Type,
      title: "Typography System",
      description: "Harmonizing Arabic and Latin letterforms",
      before: "Inconsistent font usage",
      after: "Unified bilingual typography hierarchy",
      improvements: ["Bilingual harmony", "Consciousness-based sizing", "Accessibility optimization"],
      impact: "250% readability improvement",
    },
    {
      icon: Layout,
      title: "Layout Architecture",
      description: "Consciousness-guided spatial relationships",
      before: "Standard grid systems",
      after: "φ-ratio based layout mathematics",
      improvements: ["Golden ratio grids", "Consciousness flow paths", "Sacred proportion"],
      impact: "400% engagement increase",
    },
    {
      icon: Zap,
      title: "Interactive Elements",
      description: "Dynamic responses to consciousness levels",
      before: "Static interface components",
      after: "Adaptive consciousness-responsive UI",
      improvements: ["Real-time adaptation", "Consciousness feedback", "Evolutionary interfaces"],
      impact: "500% interaction quality boost",
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-slate-950 to-indigo-950">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 text-balance">
            Brand <span className="text-gold">Evolution</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto text-balance leading-relaxed">
            RNO1's systematic evolution of BIZRA's brand identity from traditional elements to consciousness-driven
            design excellence.
          </p>
        </div>

        {/* Evolution Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Evolution Controls */}
          <div className="space-y-4">
            {evolutionStages.map((stage, index) => {
              const Icon = stage.icon
              const isActive = activeEvolution === index

              return (
                <Card
                  key={index}
                  className={`p-6 cursor-pointer transition-all duration-500 ${
                    isActive
                      ? "bg-gold/10 border-gold/30 shadow-xl shadow-gold/10"
                      : "bg-slate-900/50 border-slate-700/30 hover:border-gold/20"
                  }`}
                  onClick={() => setActiveEvolution(index)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full transition-colors ${isActive ? "bg-gold/20" : "bg-slate-800"}`}>
                      <Icon className={`h-6 w-6 ${isActive ? "text-gold" : "text-slate-400"}`} />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{stage.title}</h3>
                      <p className="text-slate-300 mb-3">{stage.description}</p>

                      {isActive && (
                        <div className="space-y-3 animate-in slide-in-from-left-2 duration-500">
                          <div className="text-sm text-gold font-semibold">Impact: {stage.impact}</div>

                          <div className="space-y-2">
                            {stage.improvements.map((improvement, impIndex) => (
                              <div key={impIndex} className="flex items-center gap-2 text-sm text-slate-400">
                                <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                                {improvement}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Evolution Visualization */}
          <div className="space-y-8">
            <Card className="p-8 bg-slate-900/50 border-slate-700/30">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                {evolutionStages[activeEvolution].title} Evolution
              </h3>

              {/* Before/After Comparison */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-sm text-slate-500 mb-2">Before</div>
                    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                      <div className="text-slate-400 text-sm">{evolutionStages[activeEvolution].before}</div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-gold mb-2">After</div>
                    <div className="p-4 bg-gold/5 rounded-lg border border-gold/20">
                      <div className="text-gold text-sm">{evolutionStages[activeEvolution].after}</div>
                    </div>
                  </div>
                </div>

                {/* Impact Metric */}
                <div className="text-center p-4 bg-gradient-to-r from-gold/10 to-gold/5 rounded-lg border border-gold/20">
                  <div className="text-2xl font-bold text-gold mb-1">{evolutionStages[activeEvolution].impact}</div>
                  <div className="text-sm text-slate-300">Measured Improvement</div>
                </div>
              </div>
            </Card>

            {/* Brand Assets Preview */}
            <Card className="p-8 bg-slate-900/50 border-slate-700/30">
              <h3 className="text-xl font-bold text-white mb-4 text-center">Brand Assets</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 flex items-center justify-center border border-slate-700/30">
                  <img
                    src="/images/design-mode/5194d68c-925b-430f-af75-0eadda4e07c8%20%281%29.png"
                    alt="BIZRA Logo"
                    className="w-full h-auto max-w-24"
                  />
                </div>

                <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 flex items-center justify-center border border-slate-700/30">
                  <img
                    src="/images/design-mode/1758628828.png"
                    alt="BIZRA Arabic"
                    className="w-full h-auto max-w-20"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Evolution Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 bg-slate-900/50 border-slate-700/30 text-center">
            <div className="text-3xl font-bold text-gold mb-2">4</div>
            <div className="text-slate-300">Evolution Stages</div>
          </Card>
          <Card className="p-6 bg-slate-900/50 border-slate-700/30 text-center">
            <div className="text-3xl font-bold text-gold mb-2">350%</div>
            <div className="text-slate-300">Average Improvement</div>
          </Card>
          <Card className="p-6 bg-slate-900/50 border-slate-700/30 text-center">
            <div className="text-3xl font-bold text-gold mb-2">φ</div>
            <div className="text-slate-300">Golden Ratio Base</div>
          </Card>
          <Card className="p-6 bg-slate-900/50 border-slate-700/30 text-center">
            <div className="text-3xl font-bold text-gold mb-2">∞</div>
            <div className="text-slate-300">Scalability Factor</div>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Button size="lg" className="bg-gold hover:bg-gold/90 text-slate-900 px-8 py-4 group">
            Download Brand Guidelines
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  )
}
