"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Palette, Eye, Sparkles, Target, Layers, Zap } from "lucide-react"

export function CreativeBranding() {
  const [activeElement, setActiveElement] = useState(0)

  const brandElements = [
    {
      icon: Palette,
      title: "Sacred Geometry",
      description: "Mathematical perfection meets visual harmony",
      visual:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5194d68c-925b-430f-af75-0eadda4e07c8%20%281%29-3Lxjt4pfWVp29BNGFKMd7smydHT3W3.png",
      details: "Golden ratio-based design system that creates natural visual flow and spiritual resonance",
    },
    {
      icon: Eye,
      title: "Arabic Calligraphy",
      description: "Cultural authenticity with modern elegance",
      visual: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1758628828-smZDmCS0pkbvLCxRmMX0Td529swaEu.png",
      details: "Hand-crafted Arabic typography that honors tradition while embracing innovation",
    },
    {
      icon: Sparkles,
      title: "Luxury Applications",
      description: "Premium brand touchpoints that inspire trust",
      visual:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Gemini_Generated_Image_fp4sqofp4sqofp4s-Mba3Fd1ITS44dXDld6QoRjLBpdxryK.png",
      details: "High-end brand applications that communicate sophistication and reliability",
    },
  ]

  const brandPrinciples = [
    {
      icon: Target,
      title: "Purpose-Driven",
      description: "Every element serves the mission of consciousness evolution",
    },
    {
      icon: Layers,
      title: "Multi-Dimensional",
      description: "Brand identity that works across digital and physical realms",
    },
    { icon: Zap, title: "Impact-Focused", description: "Visual language that communicates transformation and growth" },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveElement((prev) => (prev + 1) % brandElements.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-24 bg-gradient-to-b from-card/20 to-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            <Palette className="w-4 h-4 mr-2" />
            Creative Branding Excellence
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
            Brand Identity That
            <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent"> Transcends</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            BIZRA's brand identity combines ancient wisdom with cutting-edge design, creating a visual language that
            speaks to both tradition and innovation.
          </p>
        </div>

        {/* Brand Elements Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <div className="space-y-6">
            {brandElements.map((element, index) => {
              const Icon = element.icon
              return (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-500 hover:scale-105 ${
                    activeElement === index
                      ? "border-accent bg-accent/5 shadow-lg shadow-accent/20"
                      : "border-muted hover:border-accent/50"
                  }`}
                  onClick={() => setActiveElement(index)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`p-3 rounded-xl transition-colors ${
                          activeElement === index ? "bg-accent text-accent-foreground" : "bg-muted"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{element.title}</h3>
                        <p className="text-muted-foreground mb-3">{element.description}</p>
                        {activeElement === index && (
                          <p className="text-sm text-accent animate-fade-in-up">{element.details}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Visual Display */}
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-square">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/20 rounded-3xl blur-3xl" />
              <Card className="relative border-accent/30 bg-card/80 backdrop-blur-sm h-full">
                <CardContent className="p-8 h-full flex items-center justify-center">
                  <img
                    src={brandElements[activeElement].visual || "/placeholder.svg"}
                    alt={brandElements[activeElement].title}
                    className="w-full h-full object-contain animate-scale-in"
                    key={activeElement}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Brand Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {brandPrinciples.map((principle, index) => {
            const Icon = principle.icon
            return (
              <Card
                key={index}
                className="border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{principle.title}</h3>
                  <p className="text-muted-foreground">{principle.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
