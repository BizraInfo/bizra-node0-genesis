"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Send as Seed, Infinity } from "lucide-react"

export function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden seed-of-life-bg">
      <div className="absolute inset-0 flower-of-life-pattern opacity-20" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-96 h-96 border border-primary/10 rounded-full animate-golden-spiral" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <div
          className={`transition-all duration-1200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-card/80 border border-primary/30 mb-8 backdrop-blur-sm">
            <Seed className="h-4 w-4 text-primary animate-seed-grow" />
            <span className="text-sm font-medium text-secondary-foreground">بِذْرَة — From Seed to Forest</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-balance mb-8 leading-tight">
            Expanding Human
            <span className="block text-primary">Consciousness</span>
            <span className="block text-accent text-4xl md:text-5xl lg:text-6xl mt-4">Through Technology</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground text-pretty max-w-4xl mx-auto mb-12 leading-relaxed">
            A decentralized ecosystem where ancient wisdom meets cutting-edge cryptography. Verifiable impact that
            transforms consciousness from seed to forest, one verified action at a time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="group px-8 py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Explore the Ecosystem
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-6 text-lg bg-transparent border-primary text-primary hover:bg-primary/10"
            >
              Join the Network
              <Infinity className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="mt-16 flex justify-center items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Seed</span>
            </div>
            <div className="w-8 h-px bg-gradient-to-r from-primary to-accent" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: "0.5s" }} />
              <span>Growth</span>
            </div>
            <div className="w-8 h-px bg-gradient-to-r from-accent to-primary" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "1s" }} />
              <span>Forest</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary/50 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  )
}
