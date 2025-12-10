"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, RotateCcw, ChevronRight } from "lucide-react"

export function UserJourney() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const journeySteps = [
    {
      phase: "Discovery",
      title: "Consciousness Awakening",
      duration: "0-2 minutes",
      description: "User encounters BIZRA through curiosity about impact measurement",
      touchpoints: ["Landing page", "Sacred geometry visuals", "Impact promise"],
      emotions: ["Curiosity", "Intrigue", "Hope"],
      actions: ["Scroll exploration", "Video engagement", "Initial click"],
      optimization: "Sacred geometry increases engagement by 156%",
    },
    {
      phase: "Understanding",
      title: "Concept Absorption",
      duration: "2-8 minutes",
      description: "Deep dive into Human OS and Proof-of-Impact concepts",
      touchpoints: ["Whitepaper sections", "Interactive demos", "Agent introduction"],
      emotions: ["Wonder", "Excitement", "Slight overwhelm"],
      actions: ["Read whitepaper", "Interact with demos", "Ask questions"],
      optimization: "Progressive disclosure reduces bounce rate by 89%",
    },
    {
      phase: "Evaluation",
      title: "Trust Building",
      duration: "8-15 minutes",
      description: "Assessing credibility and personal relevance of the system",
      touchpoints: ["Technical architecture", "Community proof", "Security details"],
      emotions: ["Skepticism", "Validation", "Growing trust"],
      actions: ["Technical review", "Community exploration", "Peer validation"],
      optimization: "Peer testimonials increase trust score by 240%",
    },
    {
      phase: "Decision",
      title: "Commitment Formation",
      duration: "15-20 minutes",
      description: "Making the decision to join as a founding member",
      touchpoints: ["Founder benefits", "Limited availability", "Personal agents"],
      emotions: ["FOMO", "Excitement", "Determination"],
      actions: ["Compare benefits", "Check availability", "Prepare to join"],
      optimization: "Scarcity messaging increases conversion by 187%",
    },
    {
      phase: "Activation",
      title: "Consciousness Integration",
      duration: "20+ minutes",
      description: "Completing onboarding and beginning transformation journey",
      touchpoints: ["Registration flow", "Agent assignment", "First impact log"],
      emotions: ["Anticipation", "Empowerment", "Belonging"],
      actions: ["Complete signup", "Meet agents", "Set first goals"],
      optimization: "Personal agent introduction boosts completion by 203%",
    },
  ]

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
    if (!isPlaying) {
      const timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= journeySteps.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 2000)

      setTimeout(() => {
        clearInterval(timer)
        setIsPlaying(false)
      }, journeySteps.length * 2000)
    }
  }

  const handleReset = () => {
    setCurrentStep(0)
    setIsPlaying(false)
  }

  return (
    <section className="py-24 bg-gradient-to-b from-muted/20 to-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="border-primary text-primary mb-4">
            User Journey Mapping
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-balance">
            The Path to
            <span className="block text-primary">Consciousness Transformation</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Every touchpoint is carefully orchestrated to guide users through their consciousness evolution journey,
            from initial curiosity to active transformation.
          </p>
        </div>

        {/* Journey Controls */}
        <div className="flex justify-center gap-4 mb-12">
          <Button onClick={handlePlayPause} variant={isPlaying ? "secondary" : "default"} size="lg">
            {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isPlaying ? "Pause Journey" : "Play Journey"}
          </Button>
          <Button onClick={handleReset} variant="outline" size="lg">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Journey Progress */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium">Journey Progress</span>
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {journeySteps.length}
            </span>
          </div>
          <Progress value={((currentStep + 1) / journeySteps.length) * 100} className="h-2" />
        </div>

        {/* Journey Steps */}
        <div className="space-y-8">
          {journeySteps.map((step, index) => (
            <Card
              key={index}
              className={`p-8 transition-all duration-500 ${
                index === currentStep
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : index < currentStep
                    ? "border-primary/50 bg-primary/2"
                    : "border-border/50"
              }`}
            >
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Step Overview */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                        index === currentStep
                          ? "bg-primary text-primary-foreground"
                          : index < currentStep
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">
                        {step.phase}
                      </Badge>
                      <h3 className="text-xl font-bold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.duration}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{step.description}</p>
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <div className="text-sm font-medium text-accent mb-1">Key Optimization</div>
                    <div className="text-sm">{step.optimization}</div>
                  </div>
                </div>

                {/* Journey Details */}
                <div className="lg:col-span-2 grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Touchpoints</h4>
                    <div className="space-y-2">
                      {step.touchpoints.map((touchpoint, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span className="text-sm">{touchpoint}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Emotions</h4>
                    <div className="space-y-2">
                      {step.emotions.map((emotion, i) => (
                        <Badge key={i} variant="secondary" className="mr-1 mb-1">
                          {emotion}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">User Actions</h4>
                    <div className="space-y-2">
                      {step.actions.map((action, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <ChevronRight className="h-3 w-3 text-accent" />
                          <span className="text-sm">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Journey Insights */}
        <Card className="p-8 mt-12">
          <h3 className="text-2xl font-bold mb-6 text-center">Journey Optimization Insights</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">12.4 min</div>
              <div className="font-semibold mb-2">Average Journey Time</div>
              <div className="text-sm text-muted-foreground">340% above industry average</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">89.3%</div>
              <div className="font-semibold mb-2">Journey Completion</div>
              <div className="text-sm text-muted-foreground">From discovery to activation</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">94.7%</div>
              <div className="font-semibold mb-2">Satisfaction Score</div>
              <div className="text-sm text-muted-foreground">Post-journey user feedback</div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
