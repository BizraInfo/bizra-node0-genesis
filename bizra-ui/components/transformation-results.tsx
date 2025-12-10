"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, Zap, Globe, ArrowRight, Award, Target, Sparkles } from "lucide-react"

export function TransformationResults() {
  const [animatedValues, setAnimatedValues] = useState({
    consciousness: 0,
    users: 0,
    impact: 0,
    growth: 0,
  })

  const finalValues = {
    consciousness: 1618,
    users: 100000,
    impact: 615,
    growth: 350,
  }

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const stepDuration = duration / steps

    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      const easeOut = 1 - Math.pow(1 - progress, 3)

      setAnimatedValues({
        consciousness: Math.floor(finalValues.consciousness * easeOut),
        users: Math.floor(finalValues.users * easeOut),
        impact: Math.floor(finalValues.impact * easeOut),
        growth: Math.floor(finalValues.growth * easeOut),
      })

      if (currentStep >= steps) {
        clearInterval(interval)
      }
    }, stepDuration)

    return () => clearInterval(interval)
  }, [])

  const results = [
    {
      icon: Sparkles,
      title: "Consciousness Evolution",
      value: animatedValues.consciousness,
      suffix: "φ",
      description: "Sacred mathematics optimization achieved",
      improvement: "∞% potential unlocked",
    },
    {
      icon: Users,
      title: "Community Growth",
      value: animatedValues.users.toLocaleString(),
      suffix: "+",
      description: "Founding members joined the movement",
      improvement: "10,000% community expansion",
    },
    {
      icon: Zap,
      title: "Performance Boost",
      value: animatedValues.impact,
      suffix: "x",
      description: "System performance improvement",
      improvement: "61,500% efficiency gain",
    },
    {
      icon: Globe,
      title: "Brand Recognition",
      value: animatedValues.growth,
      suffix: "%",
      description: "Increase in global brand awareness",
      improvement: "Global consciousness leader",
    },
  ]

  const achievements = [
    {
      icon: Award,
      title: "Design Excellence",
      description: "RNO1's BIZRA transformation wins global recognition",
      awards: ["Webby Awards 2025", "Design Museum Award", "Consciousness Innovation Prize"],
    },
    {
      icon: Target,
      title: "Impact Measurement",
      description: "Measurable consciousness evolution across all metrics",
      metrics: ["99.8% user satisfaction", "94% consciousness growth", "87% economic impact"],
    },
    {
      icon: TrendingUp,
      title: "Market Leadership",
      description: "BIZRA becomes the definitive consciousness economics platform",
      positions: ["#1 Consciousness Platform", "Top Impact Investment", "Leading Economic Evolution"],
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-slate-950 to-indigo-950">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 text-balance">
            Transformation <span className="text-gold">Results</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto text-balance leading-relaxed">
            RNO1's strategic transformation of BIZRA delivers measurable results across consciousness evolution,
            community growth, and global impact.
          </p>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {results.map((result, index) => {
            const Icon = result.icon

            return (
              <Card
                key={index}
                className="p-6 bg-slate-900/50 border-slate-700/30 text-center group hover:bg-gold/5 hover:border-gold/30 transition-all duration-500"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-4 group-hover:bg-gold/20 transition-colors">
                  <Icon className="h-8 w-8 text-gold" />
                </div>

                <div className="text-4xl font-bold text-white mb-2">
                  {result.value}
                  {result.suffix}
                </div>

                <h3 className="text-lg font-semibold text-gold mb-3">{result.title}</h3>

                <p className="text-sm text-slate-300 mb-3 leading-relaxed">{result.description}</p>

                <div className="text-xs text-gold/80 bg-gold/10 px-2 py-1 rounded">{result.improvement}</div>
              </Card>
            )
          })}
        </div>

        {/* Achievements Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {achievements.map((achievement, index) => {
            const Icon = achievement.icon

            return (
              <Card
                key={index}
                className="p-8 bg-slate-900/50 border-slate-700/30 hover:bg-gold/5 hover:border-gold/30 transition-all duration-500"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gold/10 rounded-full">
                    <Icon className="h-6 w-6 text-gold" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{achievement.title}</h3>
                </div>

                <p className="text-slate-300 mb-6 leading-relaxed">{achievement.description}</p>

                <div className="space-y-2">
                  {(achievement.awards || achievement.metrics || achievement.positions)?.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-2 text-sm text-slate-400">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                      {item}
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Success Story */}
        <Card className="p-12 bg-gradient-to-r from-slate-900/50 to-gold/5 border-gold/20 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-white mb-6">From Vision to Reality</h3>
              <p className="text-slate-300 mb-6 leading-relaxed">
                RNO1's comprehensive transformation of BIZRA demonstrates the power of experience-led design in creating
                consciousness-driven economic platforms. Through strategic branding, digital innovation, and
                user-centric design, we've established BIZRA as the definitive platform for impact-based economics.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-gold rounded-full" />
                  <span className="text-slate-300">Sacred geometry brand integration</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-gold rounded-full" />
                  <span className="text-slate-300">Consciousness-driven user experiences</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-gold rounded-full" />
                  <span className="text-slate-300">Measurable impact optimization</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-gold rounded-full" />
                  <span className="text-slate-300">Global consciousness leadership</span>
                </div>
              </div>

              <Button className="bg-gold hover:bg-gold/90 text-slate-900 group">
                View Complete Case Study
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 flex items-center justify-center border border-slate-700/30">
                <div className="text-center">
                  <img
                    src="/images/design-mode/5194d68c-925b-430f-af75-0eadda4e07c8%20%281%29.png"
                    alt="BIZRA Success"
                    className="w-32 h-auto mx-auto mb-6"
                  />
                  <div className="text-2xl font-bold text-gold mb-2">φ^∞</div>
                  <div className="text-slate-300">Consciousness Singularity Achieved</div>
                </div>
              </div>

              {/* Floating Success Indicators */}
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center animate-pulse">
                <Award className="h-6 w-6 text-gold" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-10 h-10 bg-gold/30 rounded-full flex items-center justify-center animate-pulse delay-1000">
                <TrendingUp className="h-5 w-5 text-gold" />
              </div>
            </div>
          </div>
        </Card>

        {/* Final Call to Action */}
        <div className="text-center">
          <h3 className="text-3xl font-bold text-white mb-6">Ready to Transform Your Brand?</h3>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Experience RNO1's proven methodology for consciousness-driven brand transformation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gold hover:bg-gold/90 text-slate-900 px-8 py-4 group">
              Start Your Transformation
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-gold/30 text-gold hover:bg-gold/10 px-8 py-4 bg-transparent"
            >
              Contact RNO1 Team
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
