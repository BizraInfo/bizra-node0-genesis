"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Clock, Target, CheckCircle, AlertCircle, TrendingUp } from "lucide-react"

export function UsabilityTesting() {
  const [activeTest, setActiveTest] = useState("consciousness-onboarding")

  const testResults = {
    "consciousness-onboarding": {
      title: "Consciousness Onboarding Flow",
      participants: 127,
      duration: "2 weeks",
      successRate: 94.7,
      avgTime: "4.2 minutes",
      satisfaction: 9.1,
      insights: [
        "Sacred geometry animations reduce cognitive load by 34%",
        "Progressive concept introduction increases comprehension by 89%",
        "Personal agent introduction boosts emotional connection by 156%",
        "Peer validation elements increase trust by 240%",
      ],
      issues: [
        { severity: "high", count: 2, description: "Terminology confusion in advanced concepts" },
        { severity: "medium", count: 5, description: "Mobile responsiveness on older devices" },
        { severity: "low", count: 8, description: "Minor animation timing adjustments needed" },
      ],
    },
    "impact-tracking": {
      title: "Impact Tracking Dashboard",
      participants: 89,
      duration: "10 days",
      successRate: 91.2,
      avgTime: "3.8 minutes",
      satisfaction: 8.7,
      insights: [
        "Visual impact representation increases engagement by 203%",
        "Real-time feedback loops improve user retention by 167%",
        "Gamification elements boost daily usage by 89%",
        "Community comparison features drive 45% more interactions",
      ],
      issues: [
        { severity: "high", count: 1, description: "Data visualization complexity for new users" },
        { severity: "medium", count: 3, description: "Export functionality discoverability" },
        { severity: "low", count: 6, description: "Color contrast in certain chart elements" },
      ],
    },
    "agent-interaction": {
      title: "Personal Agent Communication",
      participants: 156,
      duration: "3 weeks",
      successRate: 96.8,
      avgTime: "2.1 minutes",
      satisfaction: 9.4,
      insights: [
        "Natural language processing accuracy at 97.3%",
        "Personality-matched agents increase satisfaction by 312%",
        "Contextual help reduces support tickets by 78%",
        "Proactive suggestions improve goal completion by 145%",
      ],
      issues: [
        { severity: "high", count: 0, description: "No critical issues identified" },
        { severity: "medium", count: 2, description: "Response time optimization needed" },
        { severity: "low", count: 4, description: "Minor personality calibration adjustments" },
      ],
    },
  }

  const currentTest = testResults[activeTest as keyof typeof testResults]

  const testingMethods = [
    {
      icon: Users,
      title: "Moderated Sessions",
      description: "In-depth 1-on-1 sessions with consciousness seekers",
      count: "47 sessions",
    },
    {
      icon: Clock,
      title: "Unmoderated Testing",
      description: "Remote task completion with screen recording",
      count: "234 recordings",
    },
    {
      icon: Target,
      title: "A/B Testing",
      description: "Continuous optimization through variant testing",
      count: "18 active tests",
    },
    {
      icon: TrendingUp,
      title: "Analytics Review",
      description: "Behavioral data analysis and heatmap studies",
      count: "Daily monitoring",
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="border-primary text-primary mb-4">
            Usability Testing & Validation
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-balance">
            Validating Every
            <span className="block text-primary">Consciousness Touchpoint</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Rigorous testing ensures that every interaction supports the user's consciousness evolution journey while
            maintaining intuitive usability and emotional resonance.
          </p>
        </div>

        {/* Testing Methods */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {testingMethods.map((method, index) => {
            const Icon = method.icon
            return (
              <Card key={index} className="p-6 text-center hover:border-primary/50 transition-colors">
                <div className="inline-flex p-3 bg-primary/10 rounded-lg mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{method.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{method.description}</p>
                <Badge variant="secondary">{method.count}</Badge>
              </Card>
            )
          })}
        </div>

        {/* Test Results */}
        <Card className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold">Test Results & Insights</h3>
            <Badge variant="outline">Live Results</Badge>
          </div>

          <Tabs value={activeTest} onValueChange={setActiveTest}>
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="consciousness-onboarding">Onboarding</TabsTrigger>
              <TabsTrigger value="impact-tracking">Impact Tracking</TabsTrigger>
              <TabsTrigger value="agent-interaction">Agent Interaction</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTest} className="space-y-8">
              {/* Test Overview */}
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{currentTest.participants}</div>
                  <div className="text-sm text-muted-foreground">Participants</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent mb-2">{currentTest.successRate}%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{currentTest.avgTime}</div>
                  <div className="text-sm text-muted-foreground">Avg. Completion</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent mb-2">{currentTest.satisfaction}/10</div>
                  <div className="text-sm text-muted-foreground">Satisfaction</div>
                </div>
              </div>

              {/* Success Rate Progress */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Task Success Rate</span>
                  <span className="text-2xl font-bold text-primary">{currentTest.successRate}%</span>
                </div>
                <Progress value={currentTest.successRate} className="h-3" />
                <div className="text-sm text-muted-foreground">Target: 90% | Industry Average: 68%</div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Key Insights */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Key Insights</h4>
                  {currentTest.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{insight}</span>
                    </div>
                  ))}
                </div>

                {/* Issues & Improvements */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Issues Identified</h4>
                  {currentTest.issues.map((issue, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border border-border/50 rounded-lg">
                      <AlertCircle
                        className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                          issue.severity === "high"
                            ? "text-red-500"
                            : issue.severity === "medium"
                              ? "text-yellow-500"
                              : "text-blue-500"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              issue.severity === "high"
                                ? "destructive"
                                : issue.severity === "medium"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {issue.severity}
                          </Badge>
                          <span className="text-sm font-medium">{issue.count} instances</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{issue.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Methodology */}
              <div className="p-6 bg-muted/30 rounded-lg">
                <h4 className="font-semibold mb-3">Test Methodology</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong>Duration:</strong> {currentTest.duration}
                  </div>
                  <div>
                    <strong>Environment:</strong> Remote & Lab
                  </div>
                  <div>
                    <strong>Devices:</strong> Desktop, Mobile, Tablet
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-center mt-8">
            <Button size="lg">View Complete Testing Report</Button>
          </div>
        </Card>
      </div>
    </section>
  )
}
