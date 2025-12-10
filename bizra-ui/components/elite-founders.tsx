"use client"

import type React from "react"

import { useState } from "react"
import { z } from "zod"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Crown, Star, Users, Zap, ArrowRight, CheckCircle, Clock, Loader2 } from "lucide-react"
import { eliteFoundersFormSchema, type EliteFoundersFormData } from "@/lib/validation"

export function EliteFounders() {
  const [formData, setFormData] = useState<EliteFoundersFormData>({
    name: "",
    email: "",
    expertise: "",
    vision: "",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof EliteFoundersFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const founderBenefits = [
    {
      icon: Crown,
      title: "Genesis Block Access",
      description: "Exclusive access to Block 0 with permanent founder status",
      value: "Lifetime",
    },
    {
      icon: Star,
      title: "Premium Agent Suite",
      description: "Advanced AI agent capabilities and priority features",
      value: "7 Agents",
    },
    {
      icon: Users,
      title: "Governance Rights",
      description: "Direct influence on ecosystem development and direction",
      value: "Full Voting",
    },
    {
      icon: Zap,
      title: "Impact Multiplier",
      description: "Enhanced impact scoring and token generation rates",
      value: "3x Bonus",
    },
  ]

  const founderStats = [
    { label: "Spots Remaining", value: "73", total: 100 },
    { label: "Applications", value: "247", trend: "+12 today" },
    { label: "Countries", value: "23", trend: "Global reach" },
    { label: "Avg. Experience", value: "12 yrs", trend: "Industry leaders" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      const validatedData = eliteFoundersFormSchema.parse(formData)
      // Handle form submission - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
      console.log("Form submitted:", validatedData)
      setSubmitted(true)
      setFormData({ name: "", email: "", expertise: "", vision: "" })
      setTimeout(() => setSubmitted(false), 5000)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof EliteFoundersFormData, string>> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof EliteFoundersFormData] = err.message
          }
        })
        setErrors(fieldErrors)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof EliteFoundersFormData]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    }
  }

  return (
    <section className="py-32 px-6 bg-gradient-to-b from-card/20 to-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <Badge variant="outline" className="mb-6 px-4 py-2 text-sm border-accent/30">
            AKQA Elite Selection
          </Badge>
          <h2 className="text-5xl md:text-6xl font-serif text-balance mb-6">
            Elite
            <span className="text-accent"> Founders</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Join an exclusive cohort of 100 visionary leaders shaping the future of impact-based economics. Genesis
            Block access is limited and permanent.
          </p>
        </div>

        {/* Founder Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          {founderStats.map((stat, index) => (
            <Card key={index} className="p-6 text-center bg-card/50 border-border/50">
              <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="font-semibold mb-1">{stat.label}</div>
              <div className="text-sm text-accent">{stat.trend}</div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Founder Benefits */}
          <div className="space-y-8">
            <div>
              <h3 className="text-3xl font-bold mb-6">Exclusive Benefits</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                As a founding member, you'll receive unprecedented access to BIZRA's ecosystem with permanent privileges
                and enhanced capabilities.
              </p>
            </div>

            <div className="space-y-6">
              {founderBenefits.map((benefit, index) => {
                const Icon = benefit.icon
                return (
                  <Card key={index} className="p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-accent/20 rounded-xl">
                        <Icon className="h-6 w-6 text-accent" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-semibold">{benefit.title}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {benefit.value}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Urgency Indicator */}
            <Card className="p-6 bg-gradient-to-r from-accent/10 to-primary/10 border-accent/30">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-5 w-5 text-accent" />
                <span className="font-semibold text-accent">Limited Time Opportunity</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Genesis Block access closes when we reach 100 founding members. This is a one-time opportunity with
                permanent benefits.
              </p>
            </Card>
          </div>

          {/* Application Form */}
          <Card className="p-8 bg-card/50 border-border/50">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Apply for Founding Membership</h3>
                  <p className="text-muted-foreground text-sm">
                    Tell us about your vision and expertise. Applications are reviewed within 48 hours.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="founder-name" className="text-sm font-medium mb-2 block">Full Name *</label>
                    <Input
                      id="founder-name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Your full name"
                      required
                      className={`bg-background/50 ${errors.name ? "border-destructive" : ""}`}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "founder-name-error" : undefined}
                    />
                    {errors.name && (
                      <p id="founder-name-error" className="mt-1 text-sm text-destructive">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="founder-email" className="text-sm font-medium mb-2 block">Email Address *</label>
                    <Input
                      id="founder-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="your@email.com"
                      required
                      className={`bg-background/50 ${errors.email ? "border-destructive" : ""}`}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "founder-email-error" : undefined}
                    />
                    {errors.email && (
                      <p id="founder-email-error" className="mt-1 text-sm text-destructive">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="founder-expertise" className="text-sm font-medium mb-2 block">Area of Expertise *</label>
                    <Input
                      id="founder-expertise"
                      value={formData.expertise}
                      onChange={(e) => handleInputChange("expertise", e.target.value)}
                      placeholder="e.g., AI, Blockchain, Impact Investing, Social Innovation"
                      required
                      className={`bg-background/50 ${errors.expertise ? "border-destructive" : ""}`}
                      aria-invalid={!!errors.expertise}
                      aria-describedby={errors.expertise ? "founder-expertise-error" : undefined}
                    />
                    {errors.expertise && (
                      <p id="founder-expertise-error" className="mt-1 text-sm text-destructive">
                        {errors.expertise}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="founder-vision" className="text-sm font-medium mb-2 block">Your Vision for BIZRA *</label>
                    <Textarea
                      id="founder-vision"
                      value={formData.vision}
                      onChange={(e) => handleInputChange("vision", e.target.value)}
                      placeholder="Describe how you see BIZRA transforming impact-based economics and what unique value you bring..."
                      required
                      className={`bg-background/50 min-h-[120px] ${errors.vision ? "border-destructive" : ""}`}
                      aria-invalid={!!errors.vision}
                      aria-describedby={errors.vision ? "founder-vision-error" : undefined}
                    />
                    {errors.vision && (
                      <p id="founder-vision-error" className="mt-1 text-sm text-destructive">
                        {errors.vision}
                      </p>
                    )}
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-lg py-4" disabled={isSubmitting || submitted}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : submitted ? (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Application Submitted
                    </>
                  ) : (
                    <>
                      Submit Founding Application
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By applying, you agree to BIZRA's terms and privacy policy. Founding membership is subject to approval
                  and limited to 100 members.
                </p>
              </form>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Application Submitted!</h3>
                <p className="text-muted-foreground mb-6">
                  Thank you for your interest in becoming a BIZRA founding member. Our team will review your application
                  and respond within 48 hours.
                </p>
                <Badge variant="secondary" className="px-4 py-2">
                  Application #{Math.random().toString(36).substr(2, 6).toUpperCase()}
                </Badge>
              </div>
            )}
          </Card>
        </div>

        {/* Social Proof */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-6">Trusted by industry leaders from:</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {["Google", "Microsoft", "Tesla", "OpenAI", "Stripe", "Y Combinator"].map((company, index) => (
              <div key={index} className="text-lg font-semibold">
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
