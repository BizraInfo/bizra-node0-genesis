"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Zap, Globe, Users, TrendingUp, Lock } from "lucide-react"

export function EnterpriseValue() {
  const valueProps = [
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade encryption with quantum-resistant protocols",
      metric: "99.96%",
      metricLabel: "Security Score",
    },
    {
      icon: Zap,
      title: "Performance at Scale",
      description: "615x performance improvement through optimization",
      metric: "615x",
      metricLabel: "Speed Increase",
    },
    {
      icon: Globe,
      title: "Global Infrastructure",
      description: "Distributed network with 99.9% uptime guarantee",
      metric: "99.9%",
      metricLabel: "Uptime SLA",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "7 AI agents per user for enhanced productivity",
      metric: "7x",
      metricLabel: "Productivity Gain",
    },
    {
      icon: TrendingUp,
      title: "ROI Optimization",
      description: "Measurable impact with transparent value tracking",
      metric: "340%",
      metricLabel: "Average ROI",
    },
    {
      icon: Lock,
      title: "Compliance Ready",
      description: "Built for Fortune 500 regulatory requirements",
      metric: "100%",
      metricLabel: "Compliance",
    },
  ]

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            <Shield className="w-4 h-4 mr-2" />
            Enterprise Grade
          </Badge>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            Built for <span className="text-primary">Fortune 500</span> Standards
          </h2>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            BIZRA delivers enterprise-grade reliability, security, and performance that meets the demanding requirements
            of global organizations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {valueProps.map((prop, index) => {
            const Icon = prop.icon
            return (
              <Card key={index} className="p-6 hover:bg-card/80 transition-colors group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{prop.metric}</div>
                    <div className="text-xs text-muted-foreground">{prop.metricLabel}</div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-3">{prop.title}</h3>
                <p className="text-muted-foreground">{prop.description}</p>
              </Card>
            )
          })}
        </div>

        {/* Enterprise CTA */}
        <Card className="p-8 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready for Enterprise Deployment?</h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join leading organizations that trust BIZRA for their impact measurement and value creation initiatives.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="group px-8">
              Schedule Enterprise Demo
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 bg-transparent">
              Download Whitepaper
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Trusted by organizations worldwide • SOC 2 Compliant • GDPR Ready
            </p>
          </div>
        </Card>
      </div>
    </section>
  )
}
