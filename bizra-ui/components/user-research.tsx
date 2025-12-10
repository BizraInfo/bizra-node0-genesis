"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Brain, Target, Zap, ChevronRight } from "lucide-react"

export function UserResearch() {
  const [activeResearch, setActiveResearch] = useState("personas")

  const researchMethods = [
    {
      id: "personas",
      title: "Consciousness Personas",
      icon: Users,
      description: "Deep behavioral analysis of consciousness evolution stages",
      insights: [
        "Seekers: 34% - Early consciousness exploration phase",
        "Builders: 28% - Active impact creation and measurement",
        "Leaders: 23% - Guiding others through transformation",
        "Transcenders: 15% - Advanced consciousness integration",
      ],
    },
    {
      id: "cognitive",
      title: "Cognitive Mapping",
      icon: Brain,
      description: "Understanding mental models of impact-based economics",
      insights: [
        "87% associate impact with traditional metrics initially",
        "92% shift perspective after consciousness framework exposure",
        "76% prefer visual representation of abstract concepts",
        "94% value peer validation in transformation journey",
      ],
    },
    {
      id: "behavioral",
      title: "Behavioral Analysis",
      icon: Target,
      description: "User interaction patterns with consciousness systems",
      insights: [
        "Average session: 12.4 minutes (340% above industry)",
        "Return rate: 89% within 48 hours",
        "Feature adoption: 94% use impact tracking tools",
        "Engagement depth: 78% complete full onboarding",
      ],
    },
    {
      id: "optimization",
      title: "Conversion Research",
      icon: Zap,
      description: "Data-driven insights for consciousness activation",
      insights: [
        "Sacred geometry increases engagement by 156%",
        "Personal agent introduction boosts conversion 240%",
        "Proof-of-Impact visualization drives 89% completion",
        "Community features increase retention by 312%",
      ],
    },
  ]

  const currentMethod = researchMethods.find((method) => method.id === activeResearch)

  return (
    <section className="py-24 bg-gradient-to-b from-background to-card/50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="border-primary text-primary mb-4">
            Deep User Research
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-balance">
            Understanding Consciousness
            <span className="block text-primary">Through Data</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Our research methodology combines traditional UX methods with consciousness psychology to create experiences
            that resonate at the deepest human levels.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Research Methods Navigation */}
          <div className="space-y-4">
            {researchMethods.map((method) => {
              const Icon = method.icon
              return (
                <Card
                  key={method.id}
                  className={`p-6 cursor-pointer transition-all duration-300 hover:border-primary/50 ${
                    activeResearch === method.id ? "border-primary bg-primary/5" : "border-border/50"
                  }`}
                  onClick={() => setActiveResearch(method.id)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        activeResearch === method.id ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{method.title}</h3>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${
                        activeResearch === method.id ? "rotate-90 text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Research Insights Display */}
          <div className="lg:col-span-2">
            <Card className="p-8 h-full">
              {currentMethod && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary rounded-lg">
                      <currentMethod.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{currentMethod.title}</h3>
                      <p className="text-muted-foreground">{currentMethod.description}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Key Research Insights</h4>
                    <div className="grid gap-4">
                      {currentMethod.insights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <p className="text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Research Methodology */}
                  <div className="pt-6 border-t border-border/50">
                    <h4 className="text-lg font-semibold mb-4">Research Methodology</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Sample Size</div>
                        <div className="text-2xl font-bold text-primary">2,847</div>
                        <div className="text-xs text-muted-foreground">Global participants</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Confidence Level</div>
                        <div className="text-2xl font-bold text-accent">98.5%</div>
                        <div className="text-xs text-muted-foreground">Statistical accuracy</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Research Duration</div>
                        <div className="text-2xl font-bold text-primary">6 months</div>
                        <div className="text-xs text-muted-foreground">Longitudinal study</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Methods Used</div>
                        <div className="text-2xl font-bold text-accent">12</div>
                        <div className="text-xs text-muted-foreground">Research techniques</div>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full">
                    View Detailed Research Report
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
