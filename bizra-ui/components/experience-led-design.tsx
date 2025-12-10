"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Brain, Zap, Target, ArrowRight, Play } from "lucide-react"

export function ExperienceLedDesign() {
  const [activeExperience, setActiveExperience] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const experiences = [
    {
      icon: Users,
      title: "User-Centric Journey",
      description: "Designing experiences that guide users through consciousness evolution",
      journey: [
        "Discovery & Awareness",
        "Understanding & Engagement",
        "Participation & Growth",
        "Mastery & Leadership",
      ],
      metrics: { engagement: "94%", satisfaction: "98%", retention: "89%" },
    },
    {
      icon: Brain,
      title: "Cognitive Architecture",
      description: "Building interfaces that enhance human consciousness and decision-making",
      journey: ["Intuitive Recognition", "Cognitive Processing", "Conscious Decision", "Impactful Action"],
      metrics: { clarity: "96%", efficiency: "92%", impact: "87%" },
    },
    {
      icon: Zap,
      title: "Dynamic Interactions",
      description: "Creating responsive experiences that adapt to user consciousness levels",
      journey: ["Adaptive Interface", "Personalized Content", "Contextual Guidance", "Evolutionary Growth"],
      metrics: { adaptability: "91%", personalization: "95%", growth: "88%" },
    },
    {
      icon: Target,
      title: "Impact Optimization",
      description: "Designing for measurable consciousness and economic impact",
      journey: ["Impact Measurement", "Optimization Loops", "Continuous Learning", "Exponential Growth"],
      metrics: { measurement: "99%", optimization: "93%", growth: "156%" },
    },
  ]

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setActiveExperience((prev) => (prev + 1) % experiences.length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [isPlaying])

  return (
    <section className="py-24 bg-gradient-to-b from-indigo-950 to-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 text-balance">
            Experience-Led <span className="text-gold">Design</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto text-balance leading-relaxed mb-8">
            RNO1's approach to creating transformative digital experiences that elevate human consciousness and drive
            meaningful economic impact.
          </p>

          <Button
            onClick={() => setIsPlaying(!isPlaying)}
            variant="outline"
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            <Play className="mr-2 h-4 w-4" />
            {isPlaying ? "Pause" : "Play"} Experience Demo
          </Button>
        </div>

        {/* Experience Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Experience Cards */}
          <div className="lg:col-span-2 space-y-6">
            {experiences.map((experience, index) => {
              const Icon = experience.icon
              const isActive = activeExperience === index

              return (
                <Card
                  key={index}
                  className={`p-6 cursor-pointer transition-all duration-500 ${
                    isActive
                      ? "bg-gold/5 border-gold/30 shadow-xl shadow-gold/5 scale-105"
                      : "bg-slate-900/50 border-slate-700/30 hover:border-gold/20"
                  }`}
                  onClick={() => setActiveExperience(index)}
                >
                  <div className="flex items-start gap-6">
                    <div className={`p-3 rounded-full transition-colors ${isActive ? "bg-gold/20" : "bg-slate-800"}`}>
                      <Icon className={`h-6 w-6 ${isActive ? "text-gold" : "text-slate-400"}`} />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{experience.title}</h3>
                      <p className="text-slate-300 mb-4">{experience.description}</p>

                      {isActive && (
                        <div className="space-y-4 animate-in slide-in-from-left-2 duration-500">
                          {/* Journey Steps */}
                          <div className="grid grid-cols-2 gap-3">
                            {experience.journey.map((step, stepIndex) => (
                              <div key={stepIndex} className="flex items-center gap-2 text-sm text-slate-400">
                                <div className="w-2 h-2 bg-gold/60 rounded-full" />
                                {step}
                              </div>
                            ))}
                          </div>

                          {/* Metrics */}
                          <div className="flex gap-4 pt-2">
                            {Object.entries(experience.metrics).map(([key, value]) => (
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

          {/* Experience Visualization */}
          <div className="lg:col-span-1">
            <Card className="p-8 bg-slate-900/50 border-slate-700/30 h-full">
              <h3 className="text-xl font-bold text-white mb-6 text-center">Experience Flow</h3>

              <div className="space-y-6">
                {experiences[activeExperience].journey.map((step, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-500 ${
                        index <= activeExperience ? "bg-gold text-slate-900" : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div
                      className={`flex-1 transition-colors duration-500 ${
                        index <= activeExperience ? "text-white" : "text-slate-500"
                      }`}
                    >
                      {step}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-700/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold mb-1">
                    {Object.values(experiences[activeExperience].metrics)[0]}
                  </div>
                  <div className="text-sm text-slate-400">Current Experience Score</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Button size="lg" className="bg-gold hover:bg-gold/90 text-slate-900 px-8 py-4 group">
            Experience BIZRA Platform
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  )
}
