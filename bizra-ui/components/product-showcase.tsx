"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Maximize, Eye, Users, Zap } from "lucide-react"

export function ProductShowcase() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeDemo, setActiveDemo] = useState(0)

  const demos = [
    {
      title: "Consciousness Dashboard",
      description: "Real-time visualization of impact metrics and consciousness evolution",
      metrics: { users: "1,247", impact: "φ^7.2", growth: "+23%" },
      color: "primary",
    },
    {
      title: "Agent Collaboration",
      description: "Watch 7 personal agents work together to optimize human potential",
      metrics: { agents: "7", tasks: "142", efficiency: "99.8%" },
      color: "accent",
    },
    {
      title: "Impact Verification",
      description: "Proof-of-Impact protocol validating real-world change in real-time",
      metrics: { verified: "8,934", pending: "23", accuracy: "99.96%" },
      color: "secondary-foreground",
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-background to-card/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            <Eye className="w-4 h-4 mr-2" />
            Live Product Showcase
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
            See BIZRA
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> In Action</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Experience the power of consciousness-driven technology through interactive demos and real-time system
            monitoring.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {demos.map((demo, index) => (
            <Card
              key={index}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                activeDemo === index
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
                  : "border-muted hover:border-primary/50"
              }`}
              onClick={() => setActiveDemo(index)}
            >
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">{demo.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{demo.description}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {Object.entries(demo.metrics).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="font-bold text-primary">{value}</div>
                      <div className="text-muted-foreground capitalize">{key}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Demo Display */}
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 max-w-5xl mx-auto">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">{demos[activeDemo].title}</h3>
                <p className="text-muted-foreground">{demos[activeDemo].description}</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Demo Visualization */}
            <div className="aspect-video bg-background rounded-xl border border-primary/20 mb-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />

              {/* Animated Demo Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div
                    className={`w-32 h-32 rounded-full border-4 border-primary/30 flex items-center justify-center mx-auto ${
                      isPlaying ? "animate-spin" : ""
                    }`}
                  >
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                      {activeDemo === 0 && <Users className="w-8 h-8 text-primary-foreground" />}
                      {activeDemo === 1 && <Zap className="w-8 h-8 text-primary-foreground" />}
                      {activeDemo === 2 && <Eye className="w-8 h-8 text-primary-foreground" />}
                    </div>
                  </div>
                  <div className="text-lg font-semibold">
                    {isPlaying ? "Demo Running..." : "Click Play to Start Demo"}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {Object.entries(demos[activeDemo].metrics).map(([key, value]) => (
                      <div key={key} className="bg-card/50 rounded-lg p-3">
                        <div className="font-bold text-primary text-lg">{value}</div>
                        <div className="text-muted-foreground capitalize">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Button>Request Full Demo</Button>
              <Button variant="outline">Download Specs</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
