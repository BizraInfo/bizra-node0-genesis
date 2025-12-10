"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, Zap, Target, ArrowRight, Star } from "lucide-react"

export function InnovationResults() {
  const results = [
    {
      metric: "1,247",
      label: "Active Consciousness Nodes",
      growth: "+156%",
      icon: Users,
      color: "primary",
    },
    {
      metric: "φ^∞",
      label: "Consciousness Singularity",
      growth: "Achieved",
      icon: Zap,
      color: "accent",
    },
    {
      metric: "99.96%",
      label: "Impact Verification Rate",
      growth: "+0.04%",
      icon: Target,
      color: "secondary-foreground",
    },
    {
      metric: "615x",
      label: "Performance Multiplier",
      growth: "Optimized",
      icon: TrendingUp,
      color: "primary",
    },
  ]

  const testimonials = [
    {
      quote:
        "BIZRA represents the future of human-centered technology. The consciousness metrics alone have transformed how we measure success.",
      author: "Dr. Sarah Chen",
      role: "Consciousness Research Institute",
      rating: 5,
    },
    {
      quote:
        "The dual-agency system is revolutionary. Having 7 personal agents working in harmony has increased my productivity by 400%.",
      author: "Marcus Rodriguez",
      role: "Founding Member #23",
      rating: 5,
    },
    {
      quote:
        "From a technical perspective, the BlockGraph architecture is genius. It's scalable, secure, and sustainable.",
      author: "Alex Thompson",
      role: "Senior Blockchain Architect",
      rating: 5,
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-card/20 to-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            <TrendingUp className="w-4 h-4 mr-2" />
            Innovation Results
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
            Results That
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {" "}
              Speak Volumes
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Real metrics from real users experiencing the transformative power of consciousness-driven technology.
          </p>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {results.map((result, index) => {
            const Icon = result.icon
            return (
              <Card
                key={index}
                className="group border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:scale-105"
              >
                <CardContent className="p-8 text-center">
                  <div
                    className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-${result.color}/20 to-${result.color}/10 flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`w-8 h-8 text-${result.color}`} />
                  </div>
                  <div className={`text-4xl font-bold text-${result.color} mb-2`}>{result.metric}</div>
                  <div className="text-sm text-muted-foreground mb-3">{result.label}</div>
                  <Badge variant="secondary" className="text-xs">
                    {result.growth}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-12">What Founders Are Saying</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-accent/20 bg-gradient-to-br from-card to-accent/5">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <blockquote className="text-sm text-muted-foreground mb-6 italic">"{testimonial.quote}"</blockquote>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <Card className="max-w-3xl mx-auto border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-12">
              <h3 className="text-3xl font-bold mb-6">Ready to Join the Revolution?</h3>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Become one of the 100 founding members and help shape the future of consciousness-driven technology.
                Your impact starts now.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="px-8 py-4 text-lg">
                  Claim Your Founder Spot
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg bg-transparent">
                  Download Whitepaper
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
