"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Award, Globe, Users, CheckCircle } from "lucide-react"

export function Fortune500Trust() {
  const trustIndicators = [
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "SOC 2 Type II certified with bank-grade encryption",
    },
    {
      icon: Award,
      title: "Industry Recognition",
      description: "Winner of multiple innovation and design awards",
    },
    {
      icon: Globe,
      title: "Global Scale",
      description: "Serving organizations across 50+ countries",
    },
    {
      icon: Users,
      title: "Expert Team",
      description: "Led by industry veterans from top tech companies",
    },
  ]

  const clientLogos = [
    "TechCorp",
    "GlobalInc",
    "InnovateCo",
    "FutureTech",
    "ScaleCorp",
    "ImpactInc",
    "NextGen",
    "Visionary",
  ]

  const testimonials = [
    {
      quote: "BIZRA transformed how we measure and create impact. The ROI has been exceptional.",
      author: "Michael Chen",
      role: "Chief Innovation Officer",
      company: "Fortune 100 Technology Company",
    },
    {
      quote: "The platform's enterprise-grade security and performance exceeded our expectations.",
      author: "Sarah Williams",
      role: "VP of Digital Transformation",
      company: "Global Financial Services",
    },
    {
      quote: "Implementation was seamless, and the results were immediate. Highly recommended.",
      author: "David Rodriguez",
      role: "Head of Sustainability",
      company: "International Manufacturing",
    },
  ]

  return (
    <section className="py-24 px-6 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            <Award className="w-4 h-4 mr-2" />
            Fortune 500 Trusted
          </Badge>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            Trusted by <span className="text-primary">Industry Leaders</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Leading organizations worldwide trust BIZRA to drive their impact initiatives and transform their approach
            to value creation.
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {trustIndicators.map((indicator, index) => {
            const Icon = indicator.icon
            return (
              <Card key={index} className="p-6 text-center hover:bg-card/80 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{indicator.title}</h3>
                <p className="text-sm text-muted-foreground">{indicator.description}</p>
              </Card>
            )
          })}
        </div>

        {/* Client Logos */}
        <div className="mb-16">
          <p className="text-center text-muted-foreground mb-8">Trusted by leading organizations worldwide</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8 items-center">
            {clientLogos.map((logo, index) => (
              <div
                key={index}
                className="text-center p-4 bg-background/50 rounded-lg hover:bg-card/80 transition-colors"
              >
                <div className="text-lg font-bold text-muted-foreground">{logo}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-primary rounded-full" />
                ))}
              </div>

              <blockquote className="text-muted-foreground mb-4">"{testimonial.quote}"</blockquote>

              <div className="border-t pt-4">
                <div className="font-semibold">{testimonial.author}</div>
                <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                <div className="text-sm text-primary">{testimonial.company}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Enterprise CTA */}
        <Card className="p-8 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold mb-4">Join the Fortune 500 Leaders</h3>
            <p className="text-lg text-muted-foreground mb-8">
              Experience the same enterprise-grade platform that's transforming how the world's leading organizations
              create and measure impact.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button size="lg" className="group px-8">
                Schedule Enterprise Demo
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" className="px-8 bg-transparent">
                View Case Studies
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>30-day trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Dedicated support</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
