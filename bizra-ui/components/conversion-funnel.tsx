"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ArrowDown, Users, UserCheck, Crown, TrendingUp } from "lucide-react"

export function ConversionFunnel() {
  const [animatedValues, setAnimatedValues] = useState([0, 0, 0, 0])

  const funnelStages = [
    {
      stage: "Awareness",
      icon: Users,
      visitors: 10000,
      percentage: 100,
      description: "Discover BIZRA's revolutionary approach",
      color: "text-muted-foreground",
    },
    {
      stage: "Interest",
      icon: TrendingUp,
      visitors: 3200,
      percentage: 32,
      description: "Engage with our content and demos",
      color: "text-accent",
    },
    {
      stage: "Consideration",
      icon: UserCheck,
      visitors: 1280,
      percentage: 12.8,
      description: "Complete impact assessment",
      color: "text-primary",
    },
    {
      stage: "Conversion",
      icon: Crown,
      visitors: 320,
      percentage: 3.2,
      description: "Join as founding member",
      color: "text-primary",
    },
  ]

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValues(funnelStages.map((stage) => stage.visitors))
    }, 500)
    return () => clearTimeout(timer)
  }, [funnelStages])

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            <TrendingUp className="w-4 h-4 mr-2" />
            Conversion Excellence
          </Badge>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            Optimized for <span className="text-primary">Maximum Impact</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Our data-driven approach ensures every touchpoint is optimized for conversion, turning interest into
            meaningful action and lasting engagement.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Conversion Funnel */}
          <div className="space-y-8">
            {funnelStages.map((stage, index) => {
              const Icon = stage.icon
              const isLast = index === funnelStages.length - 1

              return (
                <div key={index} className="relative">
                  <Card className="p-6 hover:bg-card/80 transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Icon className={`w-6 h-6 ${stage.color}`} />
                        </div>

                        <div>
                          <h3 className="text-xl font-semibold mb-1">{stage.stage}</h3>
                          <p className="text-muted-foreground">{stage.description}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{animatedValues[index].toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">{stage.percentage}% conversion</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-1000 ease-out"
                          style={{
                            width: `${stage.percentage}%`,
                            transitionDelay: `${index * 200}ms`,
                          }}
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Arrow between stages */}
                  {!isLast && (
                    <div className="flex justify-center my-4">
                      <ArrowDown className="w-6 h-6 text-primary animate-bounce" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Conversion Optimization */}
          <Card className="mt-16 p-8 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Conversion Rate Optimization</h3>
                <p className="text-muted-foreground mb-6">
                  Our funnel achieves industry-leading conversion rates through continuous testing, user feedback
                  integration, and data-driven improvements.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">3.2%</div>
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <div className="text-2xl font-bold text-accent">$2.4K</div>
                    <div className="text-sm text-muted-foreground">Avg. LTV</div>
                  </div>
                </div>

                <Button className="group">
                  Optimize Your Funnel
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-background to-card rounded-xl p-6 flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="w-16 h-16 text-primary mx-auto mb-4" />
                    <div className="text-xl font-bold mb-2">Performance Analytics</div>
                    <div className="text-muted-foreground">Real-time conversion tracking</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
