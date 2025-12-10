"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Target, Zap, Users, ArrowUp, ArrowDown } from "lucide-react"

export function ConversionOptimization() {
  const [currentTest, setCurrentTest] = useState(0)

  const abTests = [
    {
      name: "Sacred Geometry CTA",
      variant: "Golden Ratio Button",
      improvement: "+240%",
      confidence: "99.8%",
      description: "Button sized using φ ratio with sacred geometry hover effects",
    },
    {
      name: "Consciousness Onboarding",
      variant: "Progressive Revelation",
      improvement: "+187%",
      confidence: "98.5%",
      description: "Gradual introduction of consciousness concepts vs. full explanation",
    },
    {
      name: "Impact Visualization",
      variant: "Personal Agent Guide",
      improvement: "+156%",
      confidence: "97.2%",
      description: "AI agent explaining impact metrics vs. static dashboard",
    },
    {
      name: "Community Integration",
      variant: "Peer Validation",
      improvement: "+203%",
      confidence: "99.1%",
      description: "Showing peer progress and achievements during onboarding",
    },
  ]

  const conversionFunnel = [
    { stage: "Landing", visitors: 10000, rate: 100, color: "bg-muted" },
    { stage: "Interest", visitors: 8700, rate: 87, color: "bg-accent" },
    { stage: "Consideration", visitors: 6200, rate: 62, color: "bg-primary" },
    { stage: "Intent", visitors: 4800, rate: 48, color: "bg-primary" },
    { stage: "Conversion", visitors: 3600, rate: 36, color: "bg-primary" },
  ]

  const optimizationMetrics = [
    {
      icon: TrendingUp,
      title: "Conversion Rate",
      value: "36.2%",
      change: "+340%",
      trend: "up",
      description: "Overall consciousness activation rate",
    },
    {
      icon: Target,
      title: "Engagement Depth",
      value: "12.4 min",
      change: "+280%",
      trend: "up",
      description: "Average session duration",
    },
    {
      icon: Users,
      title: "Retention Rate",
      value: "89.3%",
      change: "+156%",
      trend: "up",
      description: "7-day user retention",
    },
    {
      icon: Zap,
      title: "Task Completion",
      value: "94.7%",
      change: "+89%",
      trend: "up",
      description: "Onboarding completion rate",
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTest((prev) => (prev + 1) % abTests.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="py-24 bg-card/50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="border-accent text-accent mb-4">
            Conversion Optimization
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-balance">
            Data-Driven
            <span className="block text-accent">Consciousness Activation</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Every element is continuously tested and optimized to maximize consciousness transformation rates while
            maintaining authentic user experience.
          </p>
        </div>

        {/* Optimization Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {optimizationMetrics.map((metric, index) => {
            const Icon = metric.icon
            const TrendIcon = metric.trend === "up" ? ArrowUp : ArrowDown
            return (
              <Card key={index} className="p-6 text-center">
                <div className="inline-flex p-3 bg-accent/10 rounded-lg mb-4">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <div className="text-3xl font-bold mb-2">{metric.value}</div>
                <div
                  className={`flex items-center justify-center gap-1 mb-2 ${
                    metric.trend === "up" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  <TrendIcon className="h-4 w-4" />
                  <span className="font-semibold">{metric.change}</span>
                </div>
                <h3 className="font-semibold mb-2">{metric.title}</h3>
                <p className="text-sm text-muted-foreground">{metric.description}</p>
              </Card>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* A/B Testing Results */}
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">A/B Testing Results</h3>
              <Badge variant="secondary">Live Tests</Badge>
            </div>

            <div className="space-y-4">
              {abTests.map((test, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-all duration-500 ${
                    index === currentTest ? "border-accent bg-accent/5" : "border-border/50 hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{test.name}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-500 border-green-500">
                        {test.improvement}
                      </Badge>
                      <Badge variant="secondary">{test.confidence}</Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    <strong>Winning Variant:</strong> {test.variant}
                  </div>
                  <p className="text-sm text-muted-foreground">{test.description}</p>
                </div>
              ))}
            </div>

            <Button className="w-full mt-6">View All Test Results</Button>
          </Card>

          {/* Conversion Funnel */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-6">Consciousness Conversion Funnel</h3>

            <div className="space-y-4">
              {conversionFunnel.map((stage, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{stage.stage}</span>
                    <div className="text-right">
                      <div className="font-bold">{stage.visitors.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{stage.rate}%</div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="h-8 bg-muted rounded-lg overflow-hidden">
                      <div
                        className={`h-full ${stage.color} transition-all duration-1000 flex items-center justify-center text-white text-sm font-medium`}
                        style={{ width: `${stage.rate}%` }}
                      >
                        {stage.rate > 20 && `${stage.rate}%`}
                      </div>
                    </div>

                    {index < conversionFunnel.length - 1 && (
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">36.2%</div>
                <div className="text-sm text-muted-foreground">Final Conversion Rate</div>
                <div className="text-xs text-primary mt-1">Industry Average: 2.4%</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
