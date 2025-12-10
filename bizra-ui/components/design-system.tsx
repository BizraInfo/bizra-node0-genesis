"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function DesignSystem() {
  const colorPalette = [
    { name: "Primary Gold", hex: "#d4af37", usage: "CTAs, highlights, sacred elements" },
    { name: "Accent Teal", hex: "#18b4c3", usage: "Data visualization, secondary actions" },
    { name: "Deep Navy", hex: "#0b1420", usage: "Primary backgrounds, depth" },
    { name: "Ink Dark", hex: "#12121a", usage: "Card surfaces, secondary backgrounds" },
    { name: "Indigo", hex: "#1a1a2e", usage: "Gradients, overlays, depth layers" },
  ]

  const typography = [
    { name: "Display", font: "Inter", size: "48-72px", usage: "Hero headlines, major sections" },
    { name: "Heading", font: "Inter", size: "24-36px", usage: "Section titles, card headers" },
    { name: "Body", font: "Inter", size: "16-18px", usage: "Main content, descriptions" },
    { name: "Caption", font: "Inter", size: "12-14px", usage: "Labels, metadata, fine print" },
    { name: "Sacred", font: "Playfair Display", size: "Variable", usage: "Arabic text, ceremonial elements" },
  ]

  const components = [
    {
      name: "Consciousness Cards",
      description: "Sacred geometry-inspired cards with golden ratio proportions",
      variants: ["Default", "Elevated", "Interactive", "Data"],
    },
    {
      name: "Impact Buttons",
      description: "CTAs optimized for consciousness activation with φ sizing",
      variants: ["Primary", "Secondary", "Ghost", "Sacred"],
    },
    {
      name: "Agent Interfaces",
      description: "Personal agent communication components with personality",
      variants: ["Chat", "Notification", "Status", "Introduction"],
    },
    {
      name: "Progress Indicators",
      description: "Consciousness evolution tracking with sacred mathematics",
      variants: ["Linear", "Circular", "Spiral", "Network"],
    },
  ]

  const designTokens = [
    { category: "Spacing", system: "Golden Ratio (φ)", values: "8px, 13px, 21px, 34px, 55px" },
    { category: "Border Radius", system: "Fibonacci", values: "3px, 5px, 8px, 13px, 21px" },
    { category: "Shadows", system: "Layered Depth", values: "4 elevation levels with sacred proportions" },
    { category: "Animation", system: "Consciousness Flow", values: "Deceleration curves, sacred timing" },
  ]

  return (
    <section className="py-24 bg-card/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="border-accent text-accent mb-4">
            Design System Architecture
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-balance">
            Sacred Mathematics
            <span className="block text-accent">Meets Modern Design</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Our design system combines ancient wisdom with contemporary UX principles, creating interfaces that resonate
            at both conscious and subconscious levels.
          </p>
        </div>

        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="tokens">Design Tokens</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-8">
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-6">Sacred Color Palette</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {colorPalette.map((color, index) => (
                  <div key={index} className="space-y-3">
                    <div className="h-24 rounded-lg border-2 border-border/20" style={{ backgroundColor: color.hex }} />
                    <div>
                      <h4 className="font-semibold">{color.name}</h4>
                      <p className="text-sm text-muted-foreground font-mono">{color.hex}</p>
                      <p className="text-xs text-muted-foreground mt-1">{color.usage}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-3">Color Psychology & Sacred Meaning</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Gold (#d4af37):</strong> Represents divine consciousness, wisdom, and transformation. Used
                    for elements that guide users toward higher awareness.
                  </div>
                  <div>
                    <strong>Teal (#18b4c3):</strong> Symbolizes clarity, communication, and flow. Applied to data
                    visualization and secondary interactions.
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="typography" className="space-y-8">
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-6">Consciousness Typography</h3>
              <div className="space-y-6">
                {typography.map((type, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{type.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {type.font} • {type.size}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{type.usage}</p>
                    </div>
                    <div className="text-right">
                      <div
                        className="font-bold"
                        style={{
                          fontSize:
                            type.name === "Display"
                              ? "24px"
                              : type.name === "Heading"
                                ? "18px"
                                : type.name === "Body"
                                  ? "16px"
                                  : "12px",
                          fontFamily: type.font === "Playfair Display" ? "serif" : "sans-serif",
                        }}
                      >
                        Consciousness Evolution
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-primary/10 rounded-lg">
                <h4 className="font-semibold mb-3">Typography Principles</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    • <strong>Hierarchy:</strong> Clear information architecture using size and weight
                  </li>
                  <li>
                    • <strong>Readability:</strong> Optimal line height (1.6) and character spacing
                  </li>
                  <li>
                    • <strong>Sacred Ratios:</strong> Font sizes follow golden ratio progression
                  </li>
                  <li>
                    • <strong>Cultural Sensitivity:</strong> Arabic typography with proper RTL support
                  </li>
                </ul>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="components" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {components.map((component, index) => (
                <Card key={index} className="p-6">
                  <h3 className="text-xl font-bold mb-3">{component.name}</h3>
                  <p className="text-muted-foreground mb-4">{component.description}</p>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Available Variants</h4>
                    <div className="flex flex-wrap gap-2">
                      {component.variants.map((variant, i) => (
                        <Badge key={i} variant="outline">
                          {variant}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Component Preview */}
                  <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-2">Component Preview</div>
                    {component.name === "Consciousness Cards" && (
                      <div className="h-16 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg border border-primary/20" />
                    )}
                    {component.name === "Impact Buttons" && (
                      <Button size="sm" className="w-full">
                        Activate Consciousness
                      </Button>
                    )}
                    {component.name === "Agent Interfaces" && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-full" />
                        <div className="flex-1 h-4 bg-muted rounded" />
                      </div>
                    )}
                    {component.name === "Progress Indicators" && (
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-primary rounded-full" />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tokens" className="space-y-8">
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-6">Sacred Design Tokens</h3>
              <div className="space-y-6">
                {designTokens.map((token, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                    <div>
                      <h4 className="font-semibold">{token.category}</h4>
                      <p className="text-sm text-muted-foreground">{token.system}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono">{token.values}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-primary/10 rounded-lg">
                  <h4 className="font-semibold mb-3">Golden Ratio Integration</h4>
                  <p className="text-sm text-muted-foreground">
                    All spacing, sizing, and proportions follow the golden ratio (φ = 1.618) to create naturally
                    harmonious interfaces that feel intuitively balanced.
                  </p>
                </div>
                <div className="p-6 bg-accent/10 rounded-lg">
                  <h4 className="font-semibold mb-3">Sacred Geometry Patterns</h4>
                  <p className="text-sm text-muted-foreground">
                    Background patterns, component layouts, and visual elements incorporate sacred geometry principles
                    to subconsciously guide user attention and flow.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
