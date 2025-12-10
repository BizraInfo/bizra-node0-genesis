"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Network, Database, Shield, Zap, Users, Brain, Coins, Globe } from "lucide-react"

export function InteractiveArchitecture() {
  const [activeLayer, setActiveLayer] = useState(0)
  const [hoveredNode, setHoveredNode] = useState<number | null>(null)

  const architectureLayers = [
    {
      name: "User Experience Layer",
      icon: Users,
      color: "text-accent",
      description: "7 Personal AI agents providing seamless human-AI collaboration",
      components: ["Personal Agents", "UI/UX Interface", "Consciousness Tracking", "Impact Visualization"],
    },
    {
      name: "Intelligence Layer",
      icon: Brain,
      color: "text-primary",
      description: "Advanced AI systems processing impact verification and economic optimization",
      components: ["Impact Analysis", "Economic Modeling", "Predictive Systems", "Learning Algorithms"],
    },
    {
      name: "Blockchain Layer",
      icon: Network,
      color: "text-accent",
      description: "BlockGraph/BlockTree architecture ensuring transparent impact verification",
      components: ["Proof-of-Impact", "Smart Contracts", "Consensus Mechanism", "Transaction Processing"],
    },
    {
      name: "Economic Layer",
      icon: Coins,
      color: "text-primary",
      description: "Dual-token system balancing stability and growth in impact-based economy",
      components: ["Stable Token", "Growth Token", "Value Distribution", "Economic Incentives"],
    },
  ]

  const networkNodes = [
    { id: 0, x: 50, y: 20, label: "Genesis Block", type: "core" },
    { id: 1, x: 20, y: 40, label: "Personal Agents", type: "agent" },
    { id: 2, x: 80, y: 40, label: "Impact Verification", type: "verification" },
    { id: 3, x: 35, y: 60, label: "Economic Engine", type: "economic" },
    { id: 4, x: 65, y: 60, label: "Community Network", type: "community" },
    { id: 5, x: 50, y: 80, label: "Global Impact", type: "impact" },
  ]

  const connections = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 4],
    [3, 5],
    [4, 5],
    [1, 4],
    [2, 3],
  ]

  return (
    <section className="py-32 px-6 bg-gradient-to-b from-background to-card/20">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <Badge variant="outline" className="mb-6 px-4 py-2 text-sm border-accent/30">
            AKQA Technical Excellence
          </Badge>
          <h2 className="text-5xl md:text-6xl font-serif text-balance mb-6">
            Interactive
            <span className="text-accent"> Architecture</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Explore BIZRA's sophisticated technical architecture designed for scalability, transparency, and
            human-centered interaction.
          </p>
        </div>

        {/* Interactive Network Visualization */}
        <div className="mb-16">
          <Card className="p-8 bg-gradient-to-br from-card/50 to-background/50 border-primary/20">
            <div className="relative h-96 bg-background/50 rounded-2xl overflow-hidden">
              <svg className="absolute inset-0 w-full h-full">
                {/* Connection Lines */}
                {connections.map(([from, to], index) => {
                  const fromNode = networkNodes[from]
                  const toNode = networkNodes[to]
                  return (
                    <line
                      key={index}
                      x1={`${fromNode.x}%`}
                      y1={`${fromNode.y}%`}
                      x2={`${toNode.x}%`}
                      y2={`${toNode.y}%`}
                      stroke="rgba(212, 175, 55, 0.3)"
                      strokeWidth="2"
                      className="transition-all duration-300"
                      style={{
                        strokeOpacity: hoveredNode === from || hoveredNode === to ? 0.8 : 0.3,
                      }}
                    />
                  )
                })}

                {/* Network Nodes */}
                {networkNodes.map((node) => (
                  <g key={node.id}>
                    <circle
                      cx={`${node.x}%`}
                      cy={`${node.y}%`}
                      r={hoveredNode === node.id ? "12" : "8"}
                      fill={node.type === "core" ? "#d4af37" : "#18b4c3"}
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    />
                    <text
                      x={`${node.x}%`}
                      y={`${node.y + 8}%`}
                      textAnchor="middle"
                      className="text-xs fill-white font-medium"
                    >
                      {node.label}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Floating Particles */}
              <div className="absolute inset-0">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-accent rounded-full opacity-60 animate-pulse"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${2 + Math.random() * 3}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Architecture Layers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div className="space-y-4">
            {architectureLayers.map((layer, index) => {
              const Icon = layer.icon
              return (
                <Card
                  key={index}
                  className={`p-6 cursor-pointer transition-all duration-300 ${
                    activeLayer === index
                      ? "bg-primary/10 border-primary/30 scale-105"
                      : "bg-card/50 border-border/50 hover:bg-card/80"
                  }`}
                  onClick={() => setActiveLayer(index)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${activeLayer === index ? "bg-primary/20" : "bg-accent/20"}`}>
                      <Icon className={`h-6 w-6 ${layer.color}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{layer.name}</h3>
                      <p className="text-sm text-muted-foreground">{layer.description}</p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Active Layer Details */}
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">{architectureLayers[activeLayer].name}</h3>
              <p className="text-muted-foreground">{architectureLayers[activeLayer].description}</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-accent">Core Components:</h4>
              <div className="grid grid-cols-2 gap-3">
                {architectureLayers[activeLayer].components.map((component, index) => (
                  <Badge key={index} variant="secondary" className="justify-center py-2">
                    {component}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border/50">
              <Button className="w-full bg-primary hover:bg-primary/90">
                Explore {architectureLayers[activeLayer].name}
              </Button>
            </div>
          </Card>
        </div>

        {/* Technical Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: Shield, label: "Security", value: "Military-Grade", desc: "End-to-end encryption" },
            { icon: Zap, label: "Performance", value: "< 100ms", desc: "Response time" },
            { icon: Database, label: "Scalability", value: "∞ Users", desc: "Horizontal scaling" },
            { icon: Globe, label: "Availability", value: "99.99%", desc: "Global uptime" },
          ].map((spec, index) => {
            const Icon = spec.icon
            return (
              <Card key={index} className="p-6 text-center bg-card/50 border-border/50">
                <Icon className="h-8 w-8 text-accent mx-auto mb-4" />
                <div className="text-2xl font-bold text-primary mb-1">{spec.value}</div>
                <div className="font-semibold mb-2">{spec.label}</div>
                <div className="text-sm text-muted-foreground">{spec.desc}</div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
