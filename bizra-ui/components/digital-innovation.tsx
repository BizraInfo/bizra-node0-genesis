"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Brain, Network, Zap, Target, ArrowRight, TrendingUp } from "lucide-react"

export function DigitalInnovation() {
  const innovations = [
    {
      icon: Brain,
      title: "Consciousness Metrics",
      description: "Revolutionary algorithms that quantify human consciousness and impact",
      impact: "φ^∞ Singularity",
      status: "Active",
      gradient: "from-primary to-accent",
    },
    {
      icon: Network,
      title: "Hyper-Network Architecture",
      description: "BlockGraph/BlockTree system that creates infinite scalability",
      impact: "615x Performance",
      status: "Optimized",
      gradient: "from-accent to-secondary-foreground",
    },
    {
      icon: Zap,
      title: "Dual-Token Economy",
      description: "Stable and Growth tokens that balance security with innovation",
      impact: "100% Stability",
      status: "Balanced",
      gradient: "from-secondary-foreground to-primary",
    },
    {
      icon: Target,
      title: "Impact Verification",
      description: "Proof-of-Impact protocol that validates real-world change",
      impact: "99.96% Accuracy",
      status: "Verified",
      gradient: "from-primary to-accent",
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-card/20 to-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            <TrendingUp className="w-4 h-4 mr-2" />
            Digital Innovation Lab
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
            Innovation That
            <span className="bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
              {" "}
              Redefines Possible
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            At the intersection of consciousness and technology, we create innovations that don't just solve
            problems—they transform reality itself.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {innovations.map((innovation, index) => {
            const Icon = innovation.icon
            return (
              <Card
                key={index}
                className="group border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:scale-105"
              >
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${innovation.gradient} text-white`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {innovation.status}
                    </Badge>
                  </div>

                  <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                    {innovation.title}
                  </h3>

                  <p className="text-muted-foreground mb-6 text-pretty">{innovation.description}</p>

                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Impact Metric</div>
                      <div
                        className={`text-2xl font-bold bg-gradient-to-r ${innovation.gradient} bg-clip-text text-transparent`}
                      >
                        {innovation.impact}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Innovation Progress Bar */}
                  <div className="w-full bg-muted rounded-full h-2 mb-4">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${innovation.gradient} transition-all duration-1000`}
                      style={{ width: `${85 + index * 5}%` }}
                    />
                  </div>

                  <div className="text-xs text-muted-foreground text-center">Innovation Level: {85 + index * 5}%</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Innovation CTA */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Innovate?</h3>
              <p className="text-muted-foreground mb-6">
                Join the 100 founding members who will shape the future of consciousness-driven technology.
              </p>
              <Button size="lg" className="px-8">
                Become a Founder
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
