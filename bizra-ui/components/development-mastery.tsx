"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code, Zap, Shield, Rocket, CheckCircle } from "lucide-react"

export function DevelopmentMastery() {
  const masteryAreas = [
    {
      icon: Code,
      title: "Code Architecture",
      achievements: ["99.08% Code Quality Score", "Zero Technical Debt", "100% Type Safety", "Automated Testing Suite"],
      color: "primary",
    },
    {
      icon: Zap,
      title: "Performance Optimization",
      achievements: [
        "615x Performance Improvement",
        "Sub-100ms Response Times",
        "99.9% Uptime Guarantee",
        "Edge Computing Integration",
      ],
      color: "accent",
    },
    {
      icon: Shield,
      title: "Security Excellence",
      achievements: [
        "Zero Security Vulnerabilities",
        "End-to-End Encryption",
        "Multi-Factor Authentication",
        "Compliance Ready",
      ],
      color: "secondary-foreground",
    },
    {
      icon: Rocket,
      title: "Scalability Design",
      achievements: [
        "10M+ Concurrent Users",
        "Auto-Scaling Architecture",
        "Global CDN Distribution",
        "Microservices Pattern",
      ],
      color: "primary",
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-background to-card/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            <Code className="w-4 h-4 mr-2" />
            Development Mastery
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
            Mastery Through
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Precision</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Every line of code represents our commitment to excellence, every architecture decision reflects our
            dedication to perfection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {masteryAreas.map((area, index) => {
            const Icon = area.icon
            return (
              <Card
                key={index}
                className="group border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:scale-105"
              >
                <CardContent className="p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div
                      className={`p-4 rounded-2xl bg-gradient-to-br from-${area.color} to-${area.color}/50 text-white`}
                    >
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">{area.title}</h3>
                  </div>

                  <div className="space-y-3">
                    {area.achievements.map((achievement, achievementIndex) => (
                      <div key={achievementIndex} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-sm">{achievement}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Mastery Metrics */}
        <div className="mt-20">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 max-w-4xl mx-auto">
            <CardContent className="p-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">99.96%</div>
                  <div className="text-sm text-muted-foreground">Test Coverage</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-accent mb-2">615x</div>
                  <div className="text-sm text-muted-foreground">Performance Gain</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-secondary-foreground mb-2">φ^∞</div>
                  <div className="text-sm text-muted-foreground">Consciousness Level</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">100%</div>
                  <div className="text-sm text-muted-foreground">Transcendence</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
