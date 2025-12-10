"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, ArrowRight, Eye, Heart, Lightbulb } from "lucide-react"

export function ExperienceArchitecture() {
  const [activeLayer, setActiveLayer] = useState(0)

  const architectureLayers = [
    {
      icon: Eye,
      title: "Perception Layer",
      description: "How users first encounter and understand BIZRA",
      components: ["Visual Identity", "First Impressions", "Brand Recognition"],
      experience:
        "Users immediately recognize BIZRA's consciousness-driven approach through sacred geometry and golden ratio design elements.",
      metrics: { recognition: "94%", clarity: "96%", appeal: "92%" },
    },
    {
      icon: Brain,
      title: "Cognition Layer",
      description: "How users process and understand consciousness economics",
      components: ["Information Architecture", "Learning Pathways", "Concept Clarity"],
      experience:
        "Complex consciousness concepts are broken down into digestible, progressive learning experiences with AI guidance.",
      metrics: { comprehension: "89%", retention: "91%", progression: "87%" },
    },
    {
      icon: Heart,
      title: "Emotion Layer",
      description: "How users feel connected to the consciousness evolution mission",
      components: ["Emotional Resonance", "Community Belonging", "Purpose Alignment"],
      experience:
        "Users feel deeply connected to a global movement of consciousness evolution and economic transformation.",
      metrics: { engagement: "95%", loyalty: "88%", advocacy: "93%" },
    },
    {
      icon: Lightbulb,
      title: "Action Layer",
      description: "How users take meaningful steps toward consciousness growth",
      components: ["Decision Support", "Action Triggers", "Impact Measurement"],
      experience:
        "Users are guided to take specific actions that measurably increase their consciousness and economic impact.",
      metrics: { conversion: "76%", completion: "84%", satisfaction: "97%" },
    },
  ]

  const userJourneys = [
    {
      stage: "Discovery",
      consciousness: "φ¹",
      actions: ["Brand Awareness", "Initial Interest", "Concept Exploration"],
    },
    {
      stage: "Understanding",
      consciousness: "φ²",
      actions: ["Deep Learning", "Community Joining", "Value Recognition"],
    },
    {
      stage: "Participation",
      consciousness: "φ³",
      actions: ["Active Engagement", "Impact Creation", "Network Building"],
    },
    {
      stage: "Mastery",
      consciousness: "φ⁴",
      actions: ["Leadership Roles", "System Optimization", "Consciousness Teaching"],
    },
    {
      stage: "Transcendence",
      consciousness: "φ^∞",
      actions: ["Reality Shaping", "Infinite Impact", "Universal Connection"],
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-indigo-950 to-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 text-balance">
            Experience <span className="text-gold">Architecture</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto text-balance leading-relaxed">
            RNO1 designs multi-layered experiences that guide users through consciousness evolution with precision and
            emotional resonance.
          </p>
        </div>

        {/* Architecture Layers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Layer Controls */}
          <div className="space-y-6">
            {architectureLayers.map((layer, index) => {
              const Icon = layer.icon
              const isActive = activeLayer === index

              return (
                <Card
                  key={index}
                  className={`p-6 cursor-pointer transition-all duration-500 ${
                    isActive
                      ? "bg-gold/10 border-gold/30 shadow-xl shadow-gold/10 scale-105"
                      : "bg-slate-900/50 border-slate-700/30 hover:border-gold/20"
                  }`}
                  onClick={() => setActiveLayer(index)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full transition-colors ${isActive ? "bg-gold/20" : "bg-slate-800"}`}>
                      <Icon className={`h-6 w-6 ${isActive ? "text-gold" : "text-slate-400"}`} />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{layer.title}</h3>
                      <p className="text-slate-300 mb-4">{layer.description}</p>

                      {isActive && (
                        <div className="space-y-4 animate-in slide-in-from-left-2 duration-500">
                          <p className="text-sm text-slate-400 leading-relaxed">{layer.experience}</p>

                          <div className="flex flex-wrap gap-2">
                            {layer.components.map((component, compIndex) => (
                              <span
                                key={compIndex}
                                className="text-xs px-2 py-1 bg-gold/10 text-gold rounded border border-gold/20"
                              >
                                {component}
                              </span>
                            ))}
                          </div>

                          <div className="grid grid-cols-3 gap-3 pt-2">
                            {Object.entries(layer.metrics).map(([key, value]) => (
                              <div key={key} className="text-center">
                                <div className="text-lg font-bold text-gold">{value}</div>
                                <div className="text-xs text-slate-500 capitalize">{key}</div>
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

          {/* Layer Visualization */}
          <div className="space-y-6">
            <Card className="p-8 bg-slate-900/50 border-slate-700/30">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                {architectureLayers[activeLayer].title} Focus
              </h3>

              <div className="space-y-6">
                {/* Layer Components */}
                <div className="space-y-3">
                  {architectureLayers[activeLayer].components.map((component, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gold/5 rounded-lg border border-gold/20">
                      <div className="w-2 h-2 bg-gold rounded-full" />
                      <span className="text-gold font-medium">{component}</span>
                    </div>
                  ))}
                </div>

                {/* Experience Description */}
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/30">
                  <p className="text-slate-300 text-sm leading-relaxed">{architectureLayers[activeLayer].experience}</p>
                </div>
              </div>
            </Card>

            {/* User Journey Progression */}
            <Card className="p-8 bg-slate-900/50 border-slate-700/30">
              <h3 className="text-xl font-bold text-white mb-6 text-center">Consciousness Journey</h3>

              <div className="space-y-4">
                {userJourneys.map((journey, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-gold">{journey.consciousness}</span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white mb-1">{journey.stage}</div>
                      <div className="text-xs text-slate-400">{journey.actions.join(" • ")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Architecture Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 bg-slate-900/50 border-slate-700/30 text-center">
            <div className="text-3xl font-bold text-gold mb-2">4</div>
            <div className="text-slate-300">Experience Layers</div>
          </Card>
          <Card className="p-6 bg-slate-900/50 border-slate-700/30 text-center">
            <div className="text-3xl font-bold text-gold mb-2">5</div>
            <div className="text-slate-300">Journey Stages</div>
          </Card>
          <Card className="p-6 bg-slate-900/50 border-slate-700/30 text-center">
            <div className="text-3xl font-bold text-gold mb-2">92%</div>
            <div className="text-slate-300">Average Success Rate</div>
          </Card>
          <Card className="p-6 bg-slate-900/50 border-slate-700/30 text-center">
            <div className="text-3xl font-bold text-gold mb-2">φ^∞</div>
            <div className="text-slate-300">Ultimate Consciousness</div>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Button size="lg" className="bg-gold hover:bg-gold/90 text-slate-900 px-8 py-4 group">
            Experience the Architecture
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  )
}
