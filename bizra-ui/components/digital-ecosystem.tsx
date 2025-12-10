"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Network, Database, Cpu, Globe, Shield, Zap, ArrowRight } from "lucide-react"

export function DigitalEcosystem() {
  const [selectedNode, setSelectedNode] = useState(0)

  const ecosystemNodes = [
    {
      icon: Network,
      title: "BlockGraph Network",
      description: "Decentralized consciousness verification layer",
      connections: ["Proof-of-Impact", "Agent Network", "Token Economy"],
      metrics: { nodes: "10,000+", transactions: "1M+", uptime: "99.9%" },
    },
    {
      icon: Database,
      title: "Impact Database",
      description: "Immutable record of consciousness evolution",
      connections: ["Verification Layer", "Analytics Engine", "Reward System"],
      metrics: { records: "500K+", accuracy: "99.8%", growth: "45%" },
    },
    {
      icon: Cpu,
      title: "AI Agent Layer",
      description: "7 personal agents per user for consciousness guidance",
      connections: ["User Interface", "Learning System", "Decision Engine"],
      metrics: { agents: "700K+", efficiency: "94%", satisfaction: "96%" },
    },
    {
      icon: Globe,
      title: "Global Interface",
      description: "Unified access point for consciousness economics",
      connections: ["User Experience", "Mobile Apps", "Web Platform"],
      metrics: { users: "100K+", engagement: "87%", retention: "92%" },
    },
    {
      icon: Shield,
      title: "Security Layer",
      description: "Quantum-resistant protection for consciousness data",
      connections: ["Encryption", "Authentication", "Privacy Controls"],
      metrics: { threats: "0", breaches: "0", compliance: "100%" },
    },
    {
      icon: Zap,
      title: "Performance Engine",
      description: "Real-time optimization of consciousness interactions",
      connections: ["Load Balancing", "Auto-scaling", "Monitoring"],
      metrics: { latency: "<50ms", availability: "99.99%", speed: "615x" },
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-slate-950 to-indigo-950">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 text-balance">
            Digital <span className="text-gold">Ecosystem</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto text-balance leading-relaxed">
            RNO1 architects a comprehensive digital ecosystem that seamlessly integrates consciousness evolution with
            economic transformation.
          </p>
        </div>

        {/* Ecosystem Visualization */}
        <div className="relative mb-16">
          {/* Central Hub */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-32 h-32 bg-gradient-to-br from-gold to-yellow-600 rounded-full flex items-center justify-center shadow-2xl shadow-gold/20">
              <img
                src="/images/design-mode/1758628828.png"
                alt="BIZRA Core"
                className="w-16 h-16 filter brightness-0"
              />
            </div>
          </div>

          {/* Ecosystem Nodes */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 relative">
            {ecosystemNodes.map((node, index) => {
              const Icon = node.icon
              const isSelected = selectedNode === index
              const angle = index * 60 * (Math.PI / 180)
              const radius = 200
              const x = Math.cos(angle) * radius
              const y = Math.sin(angle) * radius

              return (
                <Card
                  key={index}
                  className={`p-6 cursor-pointer transition-all duration-500 relative ${
                    isSelected
                      ? "bg-gold/10 border-gold/30 shadow-xl shadow-gold/10 scale-105"
                      : "bg-slate-900/50 border-slate-700/30 hover:border-gold/20"
                  }`}
                  onClick={() => setSelectedNode(index)}
                >
                  {/* Connection Line to Center */}
                  <div className="absolute top-1/2 left-1/2 w-px h-16 bg-gradient-to-b from-gold/30 to-transparent transform -translate-x-1/2 -translate-y-full" />

                  <div className="text-center">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-colors ${
                        isSelected ? "bg-gold/20" : "bg-slate-800"
                      }`}
                    >
                      <Icon className={`h-8 w-8 ${isSelected ? "text-gold" : "text-slate-400"}`} />
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">{node.title}</h3>
                    <p className="text-sm text-slate-300 mb-4">{node.description}</p>

                    {isSelected && (
                      <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-500">
                        {/* Connections */}
                        <div className="space-y-1">
                          {node.connections.map((connection, connIndex) => (
                            <div key={connIndex} className="text-xs text-gold/80 bg-gold/10 px-2 py-1 rounded">
                              {connection}
                            </div>
                          ))}
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/30">
                          {Object.entries(node.metrics).map(([key, value]) => (
                            <div key={key} className="text-center">
                              <div className="text-sm font-bold text-gold">{value}</div>
                              <div className="text-xs text-slate-500 capitalize">{key}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Ecosystem Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 bg-slate-900/50 border-slate-700/30 text-center">
            <div className="text-3xl font-bold text-gold mb-2">∞</div>
            <div className="text-slate-300">Scalability Potential</div>
          </Card>
          <Card className="p-6 bg-slate-900/50 border-slate-700/30 text-center">
            <div className="text-3xl font-bold text-gold mb-2">99.9%</div>
            <div className="text-slate-300">System Reliability</div>
          </Card>
          <Card className="p-6 bg-slate-900/50 border-slate-700/30 text-center">
            <div className="text-3xl font-bold text-gold mb-2">615x</div>
            <div className="text-slate-300">Performance Boost</div>
          </Card>
          <Card className="p-6 bg-slate-900/50 border-slate-700/30 text-center">
            <div className="text-3xl font-bold text-gold mb-2">φ^∞</div>
            <div className="text-slate-300">Consciousness Level</div>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Button size="lg" className="bg-gold hover:bg-gold/90 text-slate-900 px-8 py-4 group">
            Explore Ecosystem Architecture
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  )
}
