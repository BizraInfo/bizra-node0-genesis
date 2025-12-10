"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, CheckCircle, Circle } from "lucide-react"

export function ExperienceJourney() {
  const [activeStep, setActiveStep] = useState(0)

  const journeySteps = [
    {
      title: "Discovery",
      description: "Understand your impact potential",
      details:
        "Complete our comprehensive impact assessment to identify your unique value creation opportunities within the BIZRA ecosystem.",
      duration: "5 minutes",
      completion: 100,
    },
    {
      title: "Onboarding",
      description: "Set up your Human OS profile",
      details:
        "Configure your 7 personal AI agents and establish your impact measurement baseline with our guided setup process.",
      duration: "15 minutes",
      completion: 85,
    },
    {
      title: "Activation",
      description: "Begin generating verified impact",
      details:
        "Start creating measurable value through our Proof-of-Impact system while earning both Stable and Growth tokens.",
      duration: "Ongoing",
      completion: 60,
    },
    {
      title: "Optimization",
      description: "Scale your impact exponentially",
      details: "Leverage advanced analytics and AI recommendations to maximize your ImpactScore and economic returns.",
      duration: "Continuous",
      completion: 40,
    },
  ]

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            Your Journey to <span className="text-primary">Impact Excellence</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Experience a seamless transformation from traditional value creation to cryptographically verified impact
            generation.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Journey Steps */}
          <div className="space-y-6">
            {journeySteps.map((step, index) => (
              <Card
                key={index}
                className={`p-6 cursor-pointer transition-all duration-300 ${
                  activeStep === index ? "bg-primary/5 border-primary shadow-lg scale-105" : "hover:bg-card/80"
                }`}
                onClick={() => setActiveStep(index)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {index <= activeStep ? (
                      <CheckCircle className="w-6 h-6 text-primary" />
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold">{step.title}</h3>
                      <span className="text-sm text-muted-foreground">{step.duration}</span>
                    </div>

                    <p className="text-muted-foreground mb-3">{step.description}</p>

                    {activeStep === index && (
                      <div className="animate-fade-in-up">
                        <p className="text-sm text-foreground mb-4">{step.details}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-1000"
                                style={{ width: `${step.completion}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">{step.completion}%</span>
                          </div>

                          <Button variant="ghost" size="sm" className="group">
                            Learn More
                            <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Visual Experience */}
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-background/20" />

              <div className="relative z-10 h-full flex flex-col justify-center items-center text-center">
                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                  <div className="w-12 h-12 bg-primary rounded-full animate-pulse" />
                </div>

                <h3 className="text-2xl font-bold mb-4">{journeySteps[activeStep].title}</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">{journeySteps[activeStep].details}</p>

                <Button className="group">
                  Start {journeySteps[activeStep].title}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              {/* Decorative elements */}
              <div
                className="absolute top-4 right-4 w-16 h-16 border border-primary/30 rounded-full animate-spin"
                style={{ animationDuration: "20s" }}
              />
              <div className="absolute bottom-4 left-4 w-8 h-8 bg-accent/30 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
