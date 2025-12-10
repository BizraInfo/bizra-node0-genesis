"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart3, Users, Clock, Target, TrendingUp, Zap } from "lucide-react"

export function EngagementMetrics() {
  const [animatedMetrics, setAnimatedMetrics] = useState({
    engagement: 0,
    retention: 0,
    satisfaction: 0,
    growth: 0,
  })

  const targetMetrics = {
    engagement: 94,
    retention: 87,
    satisfaction: 4.9,
    growth: 340,
  }

  const detailedMetrics = [
    {
      icon: Users,
      title: "User Engagement",
      value: "94%",
      change: "+12%",
      description: "Monthly active user engagement rate",
      color: "text-primary",
    },
    {
      icon: Clock,
      title: "Session Duration",
      value: "8.4m",
      change: "+23%",
      description: "Average time spent per session",
      color: "text-accent",
    },
    {
      icon: Target,
      title: "Goal Completion",
      value: "87%",
      change: "+18%",
      description: "Users completing their objectives",
      color: "text-primary",
    },
    {
      icon: TrendingUp,
      title: "Growth Rate",
      value: "340%",
      change: "+45%",
      description: "Year-over-year user growth",
      color: "text-accent",
    },
    {
      icon: Zap,
      title: "Feature Adoption",
      value: "76%",
      change: "+31%",
      description: "New feature adoption within 30 days",
      color: "text-primary",
    },
    {
      icon: BarChart3,
      title: "Satisfaction Score",
      value: "4.9/5",
      change: "+0.3",
      description: "Overall user satisfaction rating",
      color: "text-accent",
    },
  ]

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedMetrics(targetMetrics)
    }, 500)
    return () => clearTimeout(timer)
  }, [targetMetrics])

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            <BarChart3 className="w-4 h-4 mr-2" />
            Performance Analytics
          </Badge>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            Measurable <span className="text-primary">Engagement Success</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Our platform consistently delivers exceptional engagement metrics, driving meaningful interactions and
            sustainable growth for our users.
          </p>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          <Card className="p-6 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="text-4xl font-bold text-primary mb-2">{Math.round(animatedMetrics.engagement)}%</div>
            <div className="font-semibold mb-1">Engagement Rate</div>
            <div className="text-sm text-muted-foreground">Industry leading</div>
          </Card>

          <Card className="p-6 text-center bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <div className="text-4xl font-bold text-accent mb-2">{Math.round(animatedMetrics.retention)}%</div>
            <div className="font-semibold mb-1">Retention Rate</div>
            <div className="text-sm text-muted-foreground">30-day retention</div>
          </Card>

          <Card className="p-6 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="text-4xl font-bold text-primary mb-2">{animatedMetrics.satisfaction.toFixed(1)}</div>
            <div className="font-semibold mb-1">Satisfaction</div>
            <div className="text-sm text-muted-foreground">Out of 5.0</div>
          </Card>

          <Card className="p-6 text-center bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <div className="text-4xl font-bold text-accent mb-2">{Math.round(animatedMetrics.growth)}%</div>
            <div className="font-semibold mb-1">Growth Rate</div>
            <div className="text-sm text-muted-foreground">Year over year</div>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {detailedMetrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <Card key={index} className="p-6 hover:bg-card/80 transition-colors group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {metric.change}
                  </Badge>
                </div>

                <div className="text-2xl font-bold mb-1">{metric.value}</div>
                <div className="font-semibold mb-2">{metric.title}</div>
                <p className="text-sm text-muted-foreground">{metric.description}</p>
              </Card>
            )
          })}
        </div>

        {/* Analytics CTA */}
        <Card className="p-8 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4">Real-Time Analytics Dashboard</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Track your impact metrics in real-time with our comprehensive analytics suite. Make data-driven
                decisions that drive meaningful engagement and growth.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="group">
                  View Live Dashboard
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" size="lg">
                  Schedule Demo
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-background to-card rounded-xl p-6 flex items-center justify-center border">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-primary mx-auto mb-4" />
                  <div className="text-xl font-bold mb-2">Live Analytics</div>
                  <div className="text-muted-foreground">Real-time performance tracking</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
