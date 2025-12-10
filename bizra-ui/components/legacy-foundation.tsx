"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Crown, Star, Zap } from "lucide-react"
import { useEffect, useState } from "react"

export function LegacyFoundation() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="py-32 bg-card/30">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-serif font-light mb-6 text-balance">Foundation of Legacy</h2>
          <div className="w-24 h-px bg-primary mx-auto mb-8"></div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Join the founding members who will shape the future of human consciousness and economic evolution. Your
            legacy starts here.
          </p>
        </div>

        {/* Founding member benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div
            className={`text-center transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-serif font-light mb-4">Founding Status</h3>
            <p className="text-muted-foreground text-sm text-pretty">
              Permanent recognition as one of the original 100 consciousness pioneers
            </p>
          </div>

          <div
            className={`text-center transition-all duration-1000 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Star className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-serif font-light mb-4">Genesis Rewards</h3>
            <p className="text-muted-foreground text-sm text-pretty">
              Exclusive access to Genesis Block rewards and consciousness multipliers
            </p>
          </div>

          <div
            className={`text-center transition-all duration-1000 delay-600 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-serif font-light mb-4">Impact Authority</h3>
            <p className="text-muted-foreground text-sm text-pretty">
              Governance rights and influence over the evolution of the BIZRA ecosystem
            </p>
          </div>
        </div>

        {/* Call to action */}
        <div className={`text-center transition-all duration-1000 delay-900 ${mounted ? "opacity-100" : "opacity-0"}`}>
          <div className="max-w-2xl mx-auto mb-12">
            <h3 className="text-3xl font-serif font-light mb-6 text-primary">Become a Founding Member</h3>
            <p className="text-muted-foreground text-pretty leading-relaxed mb-8">
              Only 100 positions available. Join the consciousness revolution and help establish the foundation for
              humanity's next evolutionary leap.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 text-lg font-medium rounded-full"
              >
                Claim Your Position
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg font-medium rounded-full bg-transparent"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Pentagram signature */}
          <div className="pt-12 border-t border-primary/20">
            <p className="text-sm font-mono tracking-widest text-muted-foreground uppercase mb-2">Brand Identity by</p>
            <div className="text-2xl font-serif font-light text-primary">Pentagram</div>
          </div>
        </div>
      </div>
    </section>
  )
}
