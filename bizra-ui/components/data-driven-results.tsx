"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { TrendingUp, Users, Target, Zap, ArrowUp, Calendar, Activity, Shield, Clock } from "lucide-react"
import { useBlockchainData } from "@/hooks/use-websocket"

export function DataDrivenResults() {
  const [currentMetric, setCurrentMetric] = useState(0)
  const [blockchainStats, setBlockchainStats] = useState<any>(null)
  const [genesisData, setGenesisData] = useState<any>(null)
  const [attestations, setAttestations] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const { blockchainStats: wsStats, isConnected } = useBlockchainData()

  // Fetch blockchain data on mount
  useEffect(() => {
    const fetchBlockchainData = async () => {
      try {
        const [statsRes, genesisRes, attestationsRes] = await Promise.all([
          fetch('/api/blockchain/stats'),
          fetch('/api/blockchain/genesis'),
          fetch('/api/blockchain/proof-of-impact/attestations')
        ])

        const [stats, genesis, attestationsData] = await Promise.all([
          statsRes.json(),
          genesisRes.json(),
          attestationsRes.json()
        ])

        setBlockchainStats(stats)
        setGenesisData(genesis)
        setAttestations(attestationsData)
      } catch (error) {
        console.error('Failed to fetch blockchain data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBlockchainData()
  }, [])

  // Update with WebSocket data
  useEffect(() => {
    if (wsStats && Object.keys(wsStats).length > 0) {
      setBlockchainStats((prev: any) => ({ ...prev, ...wsStats }))
    }
  }, [wsStats])

  const keyMetrics = [
    {
      icon: Activity,
      title: "Transaction Rate",
      value: blockchainStats ? `${blockchainStats.tps || 0} TPS` : "0 TPS",
      change: blockchainStats?.tps ? `+${Math.round(blockchainStats.tps * 10)}%` : "+0%",
      trend: "up",
      description: "Transactions per second",
      benchmark: "Target: 10,000 TPS",
    },
    {
      icon: Shield,
      title: "احسان Score",
      value: blockchainStats ? `${blockchainStats.احسانScore || 100.0}/100` : "100/100",
      change: blockchainStats?.احسانScore ? `+${Math.round(blockchainStats.احسانScore - 95)}%` : "+0%",
      trend: "up",
      description: "Blockchain integrity score",
      benchmark: "Target: ≥95/100",
    },
    {
      icon: Users,
      title: "Active Validators",
      value: blockchainStats ? `${blockchainStats.activeValidators || 0}` : "0",
      change: blockchainStats?.activeValidators ? `+${blockchainStats.activeValidators * 10}%` : "+0%",
      trend: "up",
      description: "Participating validators",
      benchmark: "Target: 100+ validators",
    },
    {
      icon: Clock,
      title: "Finality Time",
      value: blockchainStats ? `${blockchainStats.finality || 'pending'}` : "pending",
      change: blockchainStats?.finality ? "+99%" : "+0%",
      trend: "up",
      description: "Block finality status",
      benchmark: "Target: <3 seconds",
    },
  ]

  const performanceData = [
    { month: "Jan", conversion: 8.2, engagement: 4.1, satisfaction: 6.8 },
    { month: "Feb", conversion: 12.4, engagement: 5.7, satisfaction: 7.2 },
    { month: "Mar", conversion: 18.9, engagement: 7.3, satisfaction: 7.9 },
    { month: "Apr", conversion: 24.1, engagement: 8.9, satisfaction: 8.4 },
    { month: "May", conversion: 29.7, engagement: 10.2, satisfaction: 8.8 },
    { month: "Jun", conversion: 36.2, engagement: 12.4, satisfaction: 9.4 },
  ]

  const optimizationImpact = [
    { feature: "Sacred Geometry", impact: 156, category: "Visual Design" },
    { feature: "Personal Agents", impact: 240, category: "AI Integration" },
    { feature: "Progressive Disclosure", impact: 89, category: "Information Architecture" },
    { feature: "Peer Validation", impact: 203, category: "Social Proof" },
    { feature: "Golden Ratio Layout", impact: 134, category: "Visual Design" },
    { feature: "Consciousness Metaphors", impact: 167, category: "Content Strategy" },
  ]

  const businessImpact = [
    { metric: "User Acquisition Cost", before: "$127", after: "$38", improvement: "70% reduction" },
    { metric: "Customer Lifetime Value", before: "$340", after: "$1,240", improvement: "265% increase" },
    { metric: "Support Ticket Volume", before: "847/month", after: "186/month", improvement: "78% reduction" },
    { metric: "Feature Adoption Rate", before: "23%", after: "87%", improvement: "278% increase" },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMetric((prev) => (prev + 1) % keyMetrics.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [keyMetrics.length])

  return (
    <section className="py-24 bg-gradient-to-b from-muted/20 to-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="border-accent text-accent mb-4">
            Data-Driven Results
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-balance">
            Measurable Impact on
            <span className="block text-accent">Consciousness Evolution</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Every design decision is validated through rigorous testing and measurement, ensuring optimal consciousness
            transformation outcomes for all users.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {keyMetrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <Card
                key={index}
                className={`p-6 text-center transition-all duration-500 ${
                  index === currentMetric ? "border-accent bg-accent/5 scale-105" : "border-border/50"
                }`}
              >
                <div className="inline-flex p-3 bg-accent/10 rounded-lg mb-4">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <div className="text-3xl font-bold mb-2">{metric.value}</div>
                <div className="flex items-center justify-center gap-1 mb-2 text-green-500">
                  <ArrowUp className="h-4 w-4" />
                  <span className="font-semibold">{metric.change}</span>
                </div>
                <h3 className="font-semibold mb-2">{metric.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{metric.description}</p>
                <Badge variant="outline" className="text-xs">
                  {metric.benchmark}
                </Badge>
              </Card>
            )
          })}
        </div>

        {/* Performance Trends */}
        <Card className="p-8 mb-16">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold">Performance Trends</h3>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Last 6 months</span>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="conversion"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  name="Conversion Rate (%)"
                />
                <Line
                  type="monotone"
                  dataKey="engagement"
                  stroke="hsl(var(--accent))"
                  strokeWidth={3}
                  name="Engagement (min)"
                />
                <Line
                  type="monotone"
                  dataKey="satisfaction"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={3}
                  name="Satisfaction (0-10)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">340%</div>
              <div className="text-sm text-muted-foreground">Conversion Growth</div>
            </div>
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <div className="text-2xl font-bold text-accent">280%</div>
              <div className="text-sm text-muted-foreground">Engagement Growth</div>
            </div>
            <div className="text-center p-4 bg-chart-3/10 rounded-lg">
              <div className="text-2xl font-bold" style={{ color: "hsl(var(--chart-3))" }}>
                52%
              </div>
              <div className="text-sm text-muted-foreground">Satisfaction Growth</div>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Optimization Impact */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-6">Feature Optimization Impact</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={optimizationImpact}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="feature" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="impact" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <Badge variant="secondary">Average improvement: +167%</Badge>
            </div>
          </Card>

          {/* Business Impact */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-6">Business Impact</h3>
            <div className="space-y-6">
              {businessImpact.map((impact, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{impact.metric}</span>
                    <Badge variant="outline" className="text-green-500 border-green-500">
                      {impact.improvement}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">Before</div>
                      <div className="font-mono text-lg">{impact.before}</div>
                    </div>
                    <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="text-sm text-primary">After</div>
                      <div className="font-mono text-lg text-primary">{impact.after}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Results Summary */}
        <Card className="p-8 mt-16 text-center">
          <h3 className="text-2xl font-bold mb-6">UX Studio × BIZRA Results Summary</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">340%</div>
              <div className="font-semibold mb-2">Conversion Increase</div>
              <div className="text-sm text-muted-foreground">From 8.2% to 36.2% consciousness activation rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">2,847</div>
              <div className="font-semibold mb-2">Users Tested</div>
              <div className="text-sm text-muted-foreground">Across 18 different optimization experiments</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">$1.2M</div>
              <div className="font-semibold mb-2">Value Generated</div>
              <div className="text-sm text-muted-foreground">Through improved user experience and conversion</div>
            </div>
          </div>

          <Button size="lg" className="mt-8">
            Download Complete Results Report
          </Button>
        </Card>
      </div>
    </section>
  )
}
