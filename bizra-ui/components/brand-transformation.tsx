"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Target, Layers, Zap, Globe2 } from "lucide-react"

export function BrandTransformation() {
  const [activeTransformation, setActiveTransformation] = useState(0)

  const transformations = [
    {
      icon: Target,
      title: "Strategic Positioning",
      description: "Positioning BIZRA as the definitive consciousness-economics platform",
      details:
        "Through comprehensive market analysis and strategic positioning, we establish BIZRA as the pioneering force in impact-driven economic systems.",
      metrics: ["Market Leadership", "Brand Recognition", "Strategic Clarity"],
    },
    {
      icon: Layers,
      title: "Brand Architecture",
      description: "Building cohesive brand systems across all touchpoints",
      details:
        "Creating unified brand experiences that seamlessly integrate Arabic heritage with cutting-edge technology and consciousness evolution.",
      metrics: ["Brand Consistency", "Cultural Authenticity", "Modern Appeal"],
    },
    {
      icon: Zap,
      title: "Digital Innovation",
      description: "Transforming brand presence through digital excellence",
      details:
        "Leveraging advanced digital strategies to create immersive brand experiences that resonate with conscious consumers and impact investors.",
      metrics: ["Digital Engagement", "Innovation Index", "User Experience"],
    },
    {
      icon: Globe2,
      title: "Global Impact",
      description: "Scaling brand influence for worldwide transformation",
      details:
        "Establishing BIZRA as a global symbol of consciousness-driven economics, creating cultural movements that transcend traditional boundaries.",
      metrics: ["Global Reach", "Cultural Impact", "Movement Building"],
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-slate-950 to-indigo-950">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 text-balance">
            Brand <span className="text-gold">Transformation</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto text-balance leading-relaxed">
            RNO1's systematic approach to transforming BIZRA into a globally recognized symbol of consciousness-driven
            economic evolution.
          </p>
        </div>

        {/* Transformation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {transformations.map((transformation, index) => {
            const Icon = transformation.icon
            const isActive = activeTransformation === index

            return (
              <Card
                key={index}
                className={`p-8 cursor-pointer transition-all duration-500 border-2 ${
                  isActive
                    ? "bg-gold/5 border-gold/30 shadow-2xl shadow-gold/10"
                    : "bg-slate-900/50 border-slate-700/30 hover:border-gold/20"
                }`}
                onClick={() => setActiveTransformation(index)}
              >
                <div className="flex items-start gap-6">
                  <div className={`p-4 rounded-full transition-colors ${isActive ? "bg-gold/20" : "bg-slate-800"}`}>
                    <Icon className={`h-8 w-8 ${isActive ? "text-gold" : "text-slate-400"}`} />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">{transformation.title}</h3>
                    <p className="text-slate-300 mb-4 leading-relaxed">{transformation.description}</p>

                    {isActive && (
                      <div className="space-y-4 animate-in slide-in-from-top-2 duration-500">
                        <p className="text-slate-400 leading-relaxed">{transformation.details}</p>

                        <div className="flex flex-wrap gap-2">
                          {transformation.metrics.map((metric, metricIndex) => (
                            <span
                              key={metricIndex}
                              className="px-3 py-1 bg-gold/10 text-gold text-sm rounded-full border border-gold/20"
                            >
                              {metric}
                            </span>
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

        {/* Brand Evolution Showcase */}
        <div className="bg-slate-900/30 rounded-3xl p-12 border border-slate-700/30">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-white mb-6">Visual Identity Evolution</h3>
              <p className="text-slate-300 mb-8 leading-relaxed">
                From traditional Arabic calligraphy to modern digital presence, we've crafted a brand identity that
                honors heritage while embracing innovation.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-gold rounded-full" />
                  <span className="text-slate-300">Sacred geometry integration</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-gold rounded-full" />
                  <span className="text-slate-300">Cultural authenticity preservation</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-gold rounded-full" />
                  <span className="text-slate-300">Digital-first optimization</span>
                </div>
              </div>

              <Button className="mt-8 bg-gold hover:bg-gold/90 text-slate-900 group">
                View Brand Guidelines
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 flex items-center justify-center border border-slate-700/30">
                <img
                  src="/images/design-mode/Gemini_Generated_Image_fp4sqofp4sqofp4s.png"
                  alt="BIZRA Business Card"
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-gold/20 rounded-full animate-pulse" />
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-gold/30 rounded-full animate-pulse delay-1000" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
