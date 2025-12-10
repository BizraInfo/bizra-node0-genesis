"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Palette, Sparkles, Layers, Zap } from "lucide-react"

export function BrandCreativity() {
  const creativeElements = [
    {
      title: "Sacred Mathematics",
      description: "Golden ratio φ integration throughout all design elements",
      visual: "φ = 1.618034",
      color: "primary",
    },
    {
      title: "Cultural Fusion",
      description: "Arabic heritage meets modern digital aesthetics",
      visual: "بذرة",
      color: "accent",
    },
    {
      title: "Consciousness Symbols",
      description: "Visual metaphors for human potential and growth",
      visual: "∞",
      color: "secondary-foreground",
    },
    {
      title: "Impact Visualization",
      description: "Data becomes art through meaningful representation",
      visual: "⟡",
      color: "primary",
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-card/20 to-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            Brand Creativity Lab
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
            Where Art Meets
            <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              {" "}
              Consciousness
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Every creative decision is intentional, every visual element serves the greater purpose of elevating human
            consciousness through design.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {creativeElements.map((element, index) => (
            <Card
              key={index}
              className="group border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:scale-105"
            >
              <CardContent className="p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-4xl font-bold text-primary group-hover:scale-110 transition-transform">
                  {element.visual}
                </div>
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors">
                  {element.title}
                </h3>
                <p className="text-muted-foreground text-sm">{element.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Creative Process */}
        <div className="mt-20">
          <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 max-w-4xl mx-auto">
            <CardContent className="p-12 text-center">
              <div className="flex items-center justify-center space-x-8 mb-8">
                <div className="flex items-center space-x-2">
                  <Palette className="w-6 h-6 text-accent" />
                  <span className="font-semibold">Concept</span>
                </div>
                <div className="w-8 h-px bg-gradient-to-r from-accent to-primary" />
                <div className="flex items-center space-x-2">
                  <Layers className="w-6 h-6 text-primary" />
                  <span className="font-semibold">Design</span>
                </div>
                <div className="w-8 h-px bg-gradient-to-r from-primary to-accent" />
                <div className="flex items-center space-x-2">
                  <Zap className="w-6 h-6 text-accent" />
                  <span className="font-semibold">Impact</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">The Rekos Creative Process</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                From initial concept to final implementation, every creative decision is guided by the principle of
                consciousness elevation and meaningful impact creation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
