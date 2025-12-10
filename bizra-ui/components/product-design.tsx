"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Layers, Palette, Layout, Smartphone, Monitor, Tablet } from "lucide-react"

export function ProductDesign() {
  const [activeDevice, setActiveDevice] = useState("desktop")

  const designPrinciples = [
    {
      icon: Layers,
      title: "Hierarchical Clarity",
      description: "Information architecture that mirrors consciousness levels",
      metric: "94% task success rate",
    },
    {
      icon: Palette,
      title: "Sacred Aesthetics",
      description: "Visual design rooted in golden ratio and sacred geometry",
      metric: "87% aesthetic satisfaction",
    },
    {
      icon: Layout,
      title: "Intuitive Flow",
      description: "User journeys that feel natural and effortless",
      metric: "2.3s average task completion",
    },
  ]

  const deviceViews = {
    desktop: {
      icon: Monitor,
      title: "Desktop Experience",
      description: "Comprehensive dashboard for deep consciousness work",
      features: [
        "Multi-panel consciousness tracking",
        "Advanced impact visualization",
        "Collaborative agent interfaces",
        "Real-time network insights",
      ],
    },
    tablet: {
      icon: Tablet,
      title: "Tablet Experience",
      description: "Balanced interface for focused consciousness sessions",
      features: [
        "Touch-optimized sacred geometry",
        "Gesture-based navigation",
        "Portable impact tracking",
        "Offline consciousness tools",
      ],
    },
    mobile: {
      icon: Smartphone,
      title: "Mobile Experience",
      description: "Essential consciousness tools for on-the-go transformation",
      features: ["Quick impact logging", "Micro-meditation prompts", "Agent notifications", "Community quick-connect"],
    },
  }

  return (
    <section className="py-24 bg-card/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="border-accent text-accent mb-4">
            Product Design Excellence
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-balance">
            Designing for
            <span className="block text-accent">Consciousness Evolution</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Every interface element is crafted to support the user's journey from awareness to transformation, with
            design decisions backed by consciousness research.
          </p>
        </div>

        {/* Design Principles */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {designPrinciples.map((principle, index) => {
            const Icon = principle.icon
            return (
              <Card key={index} className="p-6 text-center hover:border-accent/50 transition-colors">
                <div className="inline-flex p-4 bg-accent/10 rounded-lg mb-4">
                  <Icon className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{principle.title}</h3>
                <p className="text-muted-foreground mb-4">{principle.description}</p>
                <Badge variant="secondary">{principle.metric}</Badge>
              </Card>
            )
          })}
        </div>

        {/* Responsive Design Showcase */}
        <Card className="p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">Responsive Consciousness Design</h3>
            <p className="text-muted-foreground">
              Optimized experiences across all devices for seamless consciousness evolution
            </p>
          </div>

          {/* Device Selection */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-muted rounded-lg p-1">
              {Object.entries(deviceViews).map(([key, device]) => {
                const Icon = device.icon
                return (
                  <button
                    key={key}
                    onClick={() => setActiveDevice(key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                      activeDevice === key
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{device.title}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Device View */}
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Device Mockup */}
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-background to-card border-2 border-border rounded-lg overflow-hidden">
                <div className="p-6 h-full flex flex-col">
                  {/* Mock interface based on device */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">B</span>
                      </div>
                      <span className="font-semibold">BIZRA</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-accent rounded-full" />
                      <div className="w-3 h-3 bg-primary rounded-full" />
                      <div className="w-3 h-3 bg-muted rounded-full" />
                    </div>
                  </div>

                  {/* Mock content grid */}
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-muted/50 rounded-lg p-3">
                        <div className="w-full h-2 bg-primary/30 rounded mb-2" />
                        <div className="w-2/3 h-2 bg-muted rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Device Details */}
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold mb-2">
                  {deviceViews[activeDevice as keyof typeof deviceViews].title}
                </h4>
                <p className="text-muted-foreground">
                  {deviceViews[activeDevice as keyof typeof deviceViews].description}
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium">Key Features</h5>
                {deviceViews[activeDevice as keyof typeof deviceViews].features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-accent rounded-full" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full bg-transparent">
                View {deviceViews[activeDevice as keyof typeof deviceViews].title} Prototype
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
