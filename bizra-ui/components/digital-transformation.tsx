"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Rocket, Globe, Users, Zap, ArrowRight, CheckCircle } from "lucide-react"

export function DigitalTransformation() {
  const [activePhase, setActivePhase] = useState(0)

  const transformationPhases = [
    {
      phase: "Genesis",
      timeline: "Q1 2025",
      status: "Active",
      description: "Foundation launch with 100 founding members",
      achievements: ["Genesis Block Live", "Node 0 Active", "Core Team Assembled", "Initial Funding Secured"],
      metrics: { users: "100", impact: "$50K", agents: "700" },
    },
    {
      phase: "Growth",
      timeline: "Q2-Q3 2025",
      status: "Planned",
      description: "Ecosystem expansion and feature development",
      achievements: ["1K Active Users", "Mobile App Launch", "Enterprise Partnerships", "Advanced AI Features"],
      metrics: { users: "1,000", impact: "$500K", agents: "7,000" },
    },
    {
      phase: "Scale",
      timeline: "Q4 2025 - Q2 2026",
      status: "Roadmap",
      description: "Global deployment and mass adoption",
      achievements: ["10K+ Users", "Global Presence", "Regulatory Compliance", "Institutional Adoption"],
      metrics: { users: "10,000", impact: "$5M", agents: "70,000" },
    },
    {
      phase: "Evolution",
      timeline: "2026+",
      status: "Vision",
      description: "Paradigm shift to impact-based global economy",
      achievements: ["100K+ Users", "Economic Integration", "Policy Influence", "Societal Impact"],
      metrics: { users: "100,000+", impact: "$50M+", agents: "700,000+" },
    },
  ]

  const transformationAreas = [
    {
      title: "Individual Transformation",
      icon: Users,
      description: "Personal AI agents amplify human potential and consciousness",
      benefits: ["7 Personal AI Agents", "Consciousness Tracking", "Impact Optimization", "Personal Growth"],
    },
    {
      title: "Economic Transformation",
      icon: Zap,
      description: "Shift from profit-first to impact-first economic models",
      benefits: ["Impact-Based Value", "Dual Token System", "Transparent Verification", "Sustainable Growth"],
    },
    {
      title: "Societal Transformation",
      icon: Globe,
      description: "Global network effects create positive systemic change",
      benefits: ["Collective Intelligence", "Social Impact", "Environmental Benefits", "Cultural Evolution"],
    },
  ]

  return (
    <section className="py-32 px-6 bg-gradient-to-b from-background to-card/20">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <Badge variant="outline" className="mb-6 px-4 py-2 text-sm border-accent/30">
            AKQA Transformation Strategy
          </Badge>
          <h2 className="text-5xl md:text-6xl font-serif text-balance mb-6">
            Digital
            <span className="text-accent"> Transformation</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            AKQA's strategic roadmap for transforming individual consciousness, economic systems, and global society
            through BIZRA's impact-based ecosystem.
          </p>
        </div>

        {/* Transformation Timeline */}
        <div className="mb-16">
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="timeline">Transformation Timeline</TabsTrigger>
              <TabsTrigger value="areas">Transformation Areas</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Phase Navigation */}
                <div className="space-y-4">
                  {transformationPhases.map((phase, index) => (
                    <Card
                      key={index}
                      className={`p-6 cursor-pointer transition-all duration-300 ${
                        activePhase === index
                          ? "bg-primary/10 border-primary/30 scale-105"
                          : "bg-card/50 border-border/50 hover:bg-card/80"
                      }`}
                      onClick={() => setActivePhase(index)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold">{phase.phase}</h3>
                        <Badge
                          variant={phase.status === "Active" ? "default" : "secondary"}
                          className={phase.status === "Active" ? "bg-accent" : ""}
                        >
                          {phase.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{phase.timeline}</p>
                      <p className="text-sm">{phase.description}</p>
                    </Card>
                  ))}
                </div>

                {/* Active Phase Details */}
                <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Rocket className="h-8 w-8 text-accent" />
                      <div>
                        <h3 className="text-2xl font-bold">{transformationPhases[activePhase].phase} Phase</h3>
                        <p className="text-muted-foreground">{transformationPhases[activePhase].timeline}</p>
                      </div>
                    </div>
                    <p className="text-lg mb-6">{transformationPhases[activePhase].description}</p>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {transformationPhases[activePhase].metrics.users}
                      </div>
                      <div className="text-sm text-muted-foreground">Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">
                        {transformationPhases[activePhase].metrics.impact}
                      </div>
                      <div className="text-sm text-muted-foreground">Impact Value</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {transformationPhases[activePhase].metrics.agents}
                      </div>
                      <div className="text-sm text-muted-foreground">AI Agents</div>
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-accent">Key Achievements:</h4>
                    {transformationPhases[activePhase].achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                        <span className="text-sm">{achievement}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="areas" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {transformationAreas.map((area, index) => {
                  const Icon = area.icon
                  return (
                    <Card
                      key={index}
                      className="p-8 bg-card/50 border-border/50 hover:bg-card/80 transition-all duration-300"
                    >
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Icon className="h-8 w-8 text-accent" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{area.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{area.description}</p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-accent text-sm">Key Benefits:</h4>
                        {area.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                            <span className="text-sm">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Call to Action */}
        <Card className="p-12 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/20 text-center">
          <h3 className="text-3xl font-bold mb-4">Join the Transformation</h3>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Be part of the first 100 founding members to shape the future of impact-based economics and human
            consciousness evolution.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="px-8 py-4 text-lg bg-primary hover:bg-primary/90">
              Become a Founding Member
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-accent/30 bg-transparent">
              Download Whitepaper
            </Button>
          </div>
        </Card>
      </div>
    </section>
  )
}
