"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Brain, Target, Zap } from "lucide-react"

export function StrategicVision() {
  const [activeVision, setActiveVision] = useState(0)

  const visions = [
    {
      icon: Eye,
      title: "Visionary Foresight",
      subtitle: "2025-2030 Strategic Roadmap",
      description:
        "AKQA's strategic lens reveals BIZRA as the foundational layer for next-generation economic systems, where human impact becomes the new currency of value.",
      metrics: ["5-Year Vision", "Global Scale", "Human-Centered"],
    },
    {
      icon: Brain,
      title: "Cognitive Architecture",
      subtitle: "AI-Human Symbiosis",
      description:
        "Advanced dual-agency system where 7 personal AI agents amplify human potential while maintaining authentic human decision-making at the core.",
      metrics: ["7 AI Agents", "Human Autonomy", "Cognitive Amplification"],
    },
    {
      icon: Target,
      title: "Impact Precision",
      subtitle: "Proof-of-Impact Protocol",
      description:
        "Revolutionary verification system that transforms measurable positive impact into economic value, creating unprecedented alignment between profit and purpose.",
      metrics: ["100% Verifiable", "Real Impact", "Economic Value"],
    },
    {
      icon: Zap,
      title: "Transformation Catalyst",
      subtitle: "Systemic Change Engine",
      description:
        "BIZRA serves as the catalyst for global economic transformation, shifting from extraction-based to regenerative impact-based value creation.",
      metrics: ["Global Reach", "Systemic Change", "Regenerative Economy"],
    },
  ]

  return (
    <section className="py-32 px-6 bg-gradient-to-b from-background to-card/20">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <Badge variant="outline" className="mb-6 px-4 py-2 text-sm border-accent/30">
            AKQA Strategic Framework
          </Badge>
          <h2 className="text-5xl md:text-6xl font-serif text-balance mb-6">
            Strategic Vision
            <span className="text-accent"> Architecture</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Four pillars of strategic thinking that position BIZRA as the definitive platform for human-centered
            economic evolution.
          </p>
        </div>

        {/* Interactive Vision Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {visions.map((vision, index) => {
            const Icon = vision.icon
            return (
              <Card
                key={index}
                className={`p-8 cursor-pointer transition-all duration-500 hover:scale-105 ${
                  activeVision === index
                    ? "bg-primary/10 border-primary/30 shadow-2xl shadow-primary/20"
                    : "bg-card/50 border-border/50 hover:bg-card/80"
                }`}
                onClick={() => setActiveVision(index)}
              >
                <div className="flex items-start gap-6">
                  <div className={`p-4 rounded-2xl ${activeVision === index ? "bg-primary/20" : "bg-accent/20"}`}>
                    <Icon className={`h-8 w-8 ${activeVision === index ? "text-primary" : "text-accent"}`} />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">{vision.title}</h3>
                    <p className="text-accent font-medium mb-4">{vision.subtitle}</p>
                    <p className="text-muted-foreground leading-relaxed mb-6">{vision.description}</p>

                    <div className="flex flex-wrap gap-2">
                      {vision.metrics.map((metric, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {metric}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Strategic Alignment Visualization */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-3xl" />
          <div className="relative p-12 text-center">
            <h3 className="text-3xl font-bold mb-6">Strategic Convergence</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl font-bold text-primary">A</span>
                </div>
                <p className="font-semibold">AKQA Strategy</p>
              </div>

              <div className="text-4xl text-accent">×</div>

              <div className="text-center">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl font-bold text-accent">B</span>
                </div>
                <p className="font-semibold">BIZRA Innovation</p>
              </div>

              <div className="text-4xl text-primary">=</div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl font-bold text-white">∞</span>
                </div>
                <p className="font-semibold">Infinite Impact</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
