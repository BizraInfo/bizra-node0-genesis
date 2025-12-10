"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Users, Target, TrendingUp, Eye } from "lucide-react"

export function UXStudioHero() {
  const [currentInsight, setCurrentInsight] = useState(0)

  const userInsights = [
    { metric: "98.7%", label: "User Satisfaction", icon: Users },
    { metric: "340%", label: "Conversion Increase", icon: Target },
    { metric: "2.3s", label: "Task Completion", icon: TrendingUp },
    { metric: "99.2%", label: "Clarity Score", icon: Eye },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentInsight((prev) => (prev + 1) % userInsights.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [userInsights.length])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Research-driven background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(212, 175, 55, 0.1) 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, rgba(24, 180, 195, 0.1) 2px, transparent 2px)`,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="outline" className="border-primary text-primary">
                UX Studio × BIZRA
              </Badge>
              <h1 className="text-5xl lg:text-7xl font-bold text-balance">
                Research-Driven
                <span className="block text-primary">Consciousness</span>
                <span className="block text-accent">Design</span>
              </h1>
              <p className="text-xl text-muted-foreground text-pretty max-w-2xl">
                Through deep user research and conversion optimization, we transform BIZRA's impact-based economy into
                intuitive experiences that drive measurable human consciousness evolution.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="group">
                Experience Research Journey
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg">
                View UX Methodology
              </Button>
            </div>

            {/* User insights carousel */}
            <div className="grid grid-cols-2 gap-4 pt-8">
              {userInsights.map((insight, index) => {
                const Icon = insight.icon
                return (
                  <Card
                    key={index}
                    className={`p-4 transition-all duration-500 ${
                      index === currentInsight ? "border-primary bg-primary/5" : "border-border/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-5 w-5 ${index === currentInsight ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <div>
                        <div
                          className={`text-2xl font-bold ${
                            index === currentInsight ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {insight.metric}
                        </div>
                        <div className="text-sm text-muted-foreground">{insight.label}</div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Visual Research Dashboard */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
            <Card className="relative p-8 bg-card/80 backdrop-blur-sm border-primary/20">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">User Research Dashboard</h3>
                  <Badge variant="secondary">Live Data</Badge>
                </div>

                {/* User journey visualization */}
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Consciousness Journey</span>
                    <span>Completion Rate</span>
                  </div>

                  {[
                    { phase: "Awareness", completion: 94, color: "bg-primary" },
                    { phase: "Understanding", completion: 87, color: "bg-accent" },
                    { phase: "Engagement", completion: 92, color: "bg-primary" },
                    { phase: "Transformation", completion: 89, color: "bg-accent" },
                  ].map((phase, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{phase.phase}</span>
                        <span className="font-medium">{phase.completion}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${phase.color} rounded-full transition-all duration-1000`}
                          style={{ width: `${phase.completion}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Conversion funnel */}
                <div className="pt-4 border-t border-border/50">
                  <div className="text-sm text-muted-foreground mb-3">Conversion Funnel</div>
                  <div className="space-y-2">
                    {[
                      { stage: "Visitors", count: "10,000", width: "100%" },
                      { stage: "Engaged", count: "8,700", width: "87%" },
                      { stage: "Qualified", count: "6,200", width: "62%" },
                      { stage: "Converted", count: "4,800", width: "48%" },
                    ].map((stage, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-20 text-sm">{stage.stage}</div>
                        <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
                            style={{ width: stage.width }}
                          />
                        </div>
                        <div className="w-16 text-sm font-medium text-right">{stage.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
