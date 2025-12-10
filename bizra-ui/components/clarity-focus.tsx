"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Eye, Target, Zap, CheckCircle } from "lucide-react"

export function ClarityFocus() {
  const clarityMetrics = [
    {
      icon: Eye,
      title: "Visual Hierarchy",
      score: 96,
      description: "Clear information prioritization",
      improvements: [
        "Sacred geometry guides attention flow",
        "Golden ratio spacing reduces cognitive load",
        "Color contrast exceeds WCAG AAA standards",
      ],
    },
    {
      icon: Target,
      title: "Content Clarity",
      score: 94,
      description: "Message comprehension and retention",
      improvements: [
        "Complex concepts simplified through metaphor",
        "Progressive disclosure prevents overwhelm",
        "Consciousness terminology clearly defined",
      ],
    },
    {
      icon: Zap,
      title: "Interaction Clarity",
      score: 98,
      description: "Intuitive user interface patterns",
      improvements: [
        "Consistent interaction patterns throughout",
        "Clear affordances for all interactive elements",
        "Immediate feedback for all user actions",
      ],
    },
  ]

  const beforeAfterComparison = [
    {
      aspect: "Task Completion Time",
      before: "8.7 seconds",
      after: "2.3 seconds",
      improvement: "73% faster",
    },
    {
      aspect: "Error Rate",
      before: "12.4%",
      after: "1.8%",
      improvement: "85% reduction",
    },
    {
      aspect: "User Satisfaction",
      before: "6.2/10",
      after: "9.4/10",
      improvement: "52% increase",
    },
    {
      aspect: "Comprehension Score",
      before: "67%",
      after: "94%",
      improvement: "40% improvement",
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="border-primary text-primary mb-4">
            Clarity-First Design
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-balance">
            Eliminating Confusion,
            <span className="block text-primary">Amplifying Understanding</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Every design decision is evaluated through the lens of clarity. We measure comprehension, reduce cognitive
            load, and ensure consciousness concepts are accessible to all users.
          </p>
        </div>

        {/* Clarity Metrics */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {clarityMetrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <Card key={index} className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{metric.title}</h3>
                    <p className="text-sm text-muted-foreground">{metric.description}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Clarity Score</span>
                    <span className="text-2xl font-bold text-primary">{metric.score}%</span>
                  </div>
                  <Progress value={metric.score} className="h-2" />
                </div>

                <div className="space-y-2">
                  {metric.improvements.map((improvement, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{improvement}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Before/After Comparison */}
        <Card className="p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">Clarity Impact Measurement</h3>
            <p className="text-muted-foreground">Quantifiable improvements in user understanding and task completion</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {beforeAfterComparison.map((comparison, index) => (
              <div key={index} className="text-center">
                <h4 className="font-semibold mb-4">{comparison.aspect}</h4>

                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Before</div>
                    <div className="font-mono text-lg">{comparison.before}</div>
                  </div>

                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-xs text-primary mb-1">After</div>
                    <div className="font-mono text-lg text-primary">{comparison.after}</div>
                  </div>

                  <Badge variant="secondary" className="text-xs">
                    {comparison.improvement}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button size="lg">View Detailed Clarity Analysis</Button>
          </div>
        </Card>
      </div>
    </section>
  )
}
