"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Circle, ArrowRight, Sparkles } from "lucide-react"

export function TransformationJourney() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const journeySteps = [
    {
      phase: "Discovery",
      title: "Brand Audit & Strategy",
      description: "Comprehensive analysis of BIZRA's consciousness-economics positioning",
      duration: "2 weeks",
      deliverables: ["Brand Audit Report", "Competitive Analysis", "Strategic Roadmap"],
      consciousness: "φ¹",
      completion: 100,
    },
    {
      phase: "Design",
      title: "Experience Architecture",
      description: "Crafting user journeys that guide consciousness evolution",
      duration: "4 weeks",
      deliverables: ["User Journey Maps", "Experience Prototypes", "Design System"],
      consciousness: "φ²",
      completion: 100,
    },
    {
      phase: "Development",
      title: "Digital Platform Build",
      description: "Building the technical infrastructure for consciousness economics",
      duration: "8 weeks",
      deliverables: ["Platform MVP", "AI Agent Integration", "Blockchain Layer"],
      consciousness: "φ³",
      completion: 85,
    },
    {
      phase: "Integration",
      title: "Ecosystem Connection",
      description: "Connecting all systems for seamless consciousness tracking",
      duration: "3 weeks",
      deliverables: ["API Integration", "Data Synchronization", "Testing Suite"],
      consciousness: "φ⁴",
      completion: 60,
    },
    {
      phase: "Launch",
      title: "Market Introduction",
      description: "Strategic launch to founding members and consciousness leaders",
      duration: "2 weeks",
      deliverables: ["Launch Campaign", "Onboarding Flow", "Support System"],
      consciousness: "φ⁵",
      completion: 30,
    },
    {
      phase: "Evolution",
      title: "Continuous Growth",
      description: "Ongoing optimization based on consciousness feedback loops",
      duration: "Ongoing",
      deliverables: ["Analytics Dashboard", "Optimization Reports", "Feature Updates"],
      consciousness: "φ^∞",
      completion: 0,
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep((prev) => (prev + 1) % journeySteps.length)
        setIsAnimating(false)
      }, 300)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-24 bg-gradient-to-b from-indigo-950 to-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 text-balance">
            Transformation <span className="text-gold">Journey</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto text-balance leading-relaxed">
            RNO1's systematic approach to transforming BIZRA from concept to consciousness-driven economic platform.
          </p>
        </div>

        {/* Journey Timeline */}
        <div className="relative mb-16">
          {/* Progress Line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-700">
            <div
              className="w-px bg-gradient-to-b from-gold to-gold/50 transition-all duration-1000"
              style={{ height: `${((currentStep + 1) / journeySteps.length) * 100}%` }}
            />
          </div>

          {/* Journey Steps */}
          <div className="space-y-8">
            {journeySteps.map((step, index) => {
              const isActive = currentStep === index
              const isCompleted = index < currentStep
              const isCurrent = index === currentStep

              return (
                <div
                  key={index}
                  className={`relative flex items-start gap-8 transition-all duration-500 ${
                    isActive ? "scale-105" : ""
                  } ${isAnimating && isActive ? "opacity-50" : "opacity-100"}`}
                >
                  {/* Step Indicator */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isCompleted
                          ? "bg-gold text-slate-900"
                          : isCurrent
                            ? "bg-gold/20 border-2 border-gold text-gold"
                            : "bg-slate-800 border-2 border-slate-600 text-slate-400"
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="h-8 w-8" /> : <Circle className="h-8 w-8" />}
                    </div>

                    {/* Consciousness Level */}
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          isCurrent ? "bg-gold/20 text-gold" : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {step.consciousness}
                      </span>
                    </div>
                  </div>

                  {/* Step Content */}
                  <Card
                    className={`flex-1 p-6 transition-all duration-500 ${
                      isCurrent
                        ? "bg-gold/5 border-gold/30 shadow-xl shadow-gold/5"
                        : "bg-slate-900/50 border-slate-700/30"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`text-sm px-3 py-1 rounded-full ${
                              isCurrent ? "bg-gold/20 text-gold" : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {step.phase}
                          </span>
                          <span className="text-sm text-slate-500">{step.duration}</span>
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                        <p className="text-slate-300 mb-4 leading-relaxed">{step.description}</p>

                        {/* Deliverables */}
                        <div className="flex flex-wrap gap-2">
                          {step.deliverables.map((deliverable, delIndex) => (
                            <span key={delIndex} className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded">
                              {deliverable}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Progress Circle */}
                      <div className="flex-shrink-0">
                        <div className="relative w-20 h-20">
                          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="rgb(51 65 85)"
                              strokeWidth="2"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="rgb(255 215 0)"
                              strokeWidth="2"
                              strokeDasharray={`${step.completion}, 100`}
                              className="transition-all duration-1000"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold text-gold">{step.completion}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>

        {/* Journey Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 bg-slate-900/50 border-slate-700/30 text-center">
            <Sparkles className="h-8 w-8 text-gold mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">19</div>
            <div className="text-slate-300">Total Weeks</div>
          </Card>
          <Card className="p-6 bg-slate-900/50 border-slate-700/30 text-center">
            <div className="text-2xl font-bold text-gold mb-1">6</div>
            <div className="text-slate-300">Transformation Phases</div>
          </Card>
          <Card className="p-6 bg-slate-900/50 border-slate-700/30 text-center">
            <div className="text-2xl font-bold text-gold mb-1">18</div>
            <div className="text-slate-300">Key Deliverables</div>
          </Card>
          <Card className="p-6 bg-slate-900/50 border-slate-700/30 text-center">
            <div className="text-2xl font-bold text-gold mb-1">φ^∞</div>
            <div className="text-slate-300">Final Consciousness</div>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Button size="lg" className="bg-gold hover:bg-gold/90 text-slate-900 px-8 py-4 group">
            Start Your Transformation
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  )
}
