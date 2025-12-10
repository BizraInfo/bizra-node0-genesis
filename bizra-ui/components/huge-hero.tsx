"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play, Users, TrendingUp, Shield } from "lucide-react"

export function HugeHero() {
  const [currentMetric, setCurrentMetric] = useState(0)

  const metrics = [
    { value: "100", label: "Founding Members", icon: Users },
    { value: "615x", label: "Performance Gain", icon: TrendingUp },
    { value: "99.96%", label: "Security Score", icon: Shield },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMetric((prev) => (prev + 1) % metrics.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Enterprise-grade background with subtle animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        {/* Campaign-style headline */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium text-primary">Genesis Block 0 • Live Now</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold mb-6 text-balance">
            <span className="bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
              Transform Impact
            </span>
            <br />
            <span className="text-foreground">Into Value</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 text-pretty">
            BIZRA revolutionizes economics through cryptographically verifiable impact. Join the first Human Operating
            System that makes measurable change the foundation of value.
          </p>
        </div>

        {/* Experience-focused metrics */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12">
          <div className="flex items-center gap-4">
            {metrics.map((metric, index) => {
              const Icon = metric.icon
              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl border transition-all duration-500 ${
                    currentMetric === index
                      ? "bg-primary/10 border-primary text-primary scale-105"
                      : "bg-card/50 border-border text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <div className="text-sm">{metric.label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Conversion-focused CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="group px-8 py-4 text-lg">
            Join Founding 100
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button variant="outline" size="lg" className="group px-8 py-4 text-lg bg-transparent">
            <Play className="mr-2 w-5 h-5" />
            Watch Demo
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground mb-4">Trusted by forward-thinking organizations</p>
          <div className="flex items-center justify-center gap-8 opacity-60">
            <div className="text-lg font-semibold">Enterprise Ready</div>
            <div className="w-px h-6 bg-border" />
            <div className="text-lg font-semibold">Fortune 500 Grade</div>
            <div className="w-px h-6 bg-border" />
            <div className="text-lg font-semibold">Quantum Secured</div>
          </div>
        </div>
      </div>
    </section>
  )
}
