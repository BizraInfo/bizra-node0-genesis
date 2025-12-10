"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VolumeX, Volume2, RotateCcw } from "lucide-react"

export function ImmersiveExperience() {
  const [isActive, setIsActive] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [experiencePhase, setExperiencePhase] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const phases = [
    { name: "Seed", color: "#d4af37", description: "The beginning of impact" },
    { name: "Growth", color: "#18b4c3", description: "Expanding consciousness" },
    { name: "Bloom", color: "#e5c687", description: "Full realization" },
    { name: "Ecosystem", color: "#d4af37", description: "Interconnected value" },
  ]

  useEffect(() => {
    if (!isActive || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      life: number
    }> = []

    const createParticle = () => {
      const currentPhase = phases[experiencePhase]
      return {
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 4 + 1,
        color: currentPhase.color,
        life: 1,
      }
    }

    // Initialize particles
    for (let i = 0; i < 50; i++) {
      particles.push(createParticle())
    }

    const animate = () => {
      ctx.fillStyle = "rgba(11, 20, 32, 0.1)"
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      particles.forEach((particle, index) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life -= 0.01

        if (
          particle.life <= 0 ||
          particle.x < 0 ||
          particle.x > canvas.offsetWidth ||
          particle.y < 0 ||
          particle.y > canvas.offsetHeight
        ) {
          particles[index] = createParticle()
        }

        ctx.globalAlpha = particle.life
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      })

      if (isActive) {
        requestAnimationFrame(animate)
      }
    }

    animate()

    const phaseInterval = setInterval(() => {
      setExperiencePhase((prev) => (prev + 1) % phases.length)
    }, 3000)

    return () => {
      clearInterval(phaseInterval)
    }
  }, [isActive, experiencePhase])

  return (
    <section className="py-32 px-6 bg-gradient-to-b from-card/20 to-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <Badge variant="outline" className="mb-6 px-4 py-2 text-sm border-accent/30">
            AKQA Immersive Technology
          </Badge>
          <h2 className="text-5xl md:text-6xl font-serif text-balance mb-6">
            Experience
            <span className="text-accent"> Transformation</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Step into BIZRA's immersive ecosystem where consciousness, technology, and economic value converge in
            unprecedented ways.
          </p>
        </div>

        {/* Immersive Canvas Experience */}
        <div className="relative mb-16">
          <Card className="p-8 bg-gradient-to-br from-card/50 to-background/50 border-primary/20">
            <div className="relative h-96 rounded-2xl overflow-hidden bg-background/80">
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{
                  background: "radial-gradient(circle at center, rgba(212, 175, 55, 0.1), rgba(11, 20, 32, 1))",
                }}
              />

              {/* Experience Controls Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-8">
                    <h3 className="text-4xl font-bold text-white mb-2">{phases[experiencePhase].name}</h3>
                    <p className="text-accent text-lg">{phases[experiencePhase].description}</p>
                  </div>

                  {!isActive ? (
                    <Button
                      size="lg"
                      onClick={() => setIsActive(true)}
                      className="px-8 py-4 text-lg bg-primary hover:bg-primary/90"
                    >
                      Begin Immersive Experience
                    </Button>
                  ) : (
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="border-primary/30"
                      >
                        {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsActive(false)
                          setExperiencePhase(0)
                        }}
                        className="border-primary/30"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Phase Indicators */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="flex gap-2">
                  {phases.map((phase, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-500 ${
                        index === experiencePhase ? "bg-primary scale-125" : "bg-white/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Experience Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Multi-Sensory Engagement",
              description:
                "Visual, auditory, and haptic feedback create deep emotional connection with the BIZRA ecosystem.",
              metric: "360°",
            },
            {
              title: "Real-Time Adaptation",
              description:
                "AI-driven experience that evolves based on user interaction patterns and consciousness states.",
              metric: "∞ Variations",
            },
            {
              title: "Collective Intelligence",
              description: "Shared experiences that build community understanding of impact-based economics.",
              metric: "100 Founders",
            },
          ].map((feature, index) => (
            <Card key={index} className="p-6 bg-card/50 border-border/50 hover:bg-card/80 transition-all duration-300">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent mb-4">{feature.metric}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
