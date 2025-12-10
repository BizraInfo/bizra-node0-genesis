"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Code, Zap, Shield, Rocket, Monitor, Smartphone, Globe, ArrowRight } from "lucide-react"

export function WebDevelopmentExcellence() {
  const [activeStack, setActiveStack] = useState(0)

  const techStacks = [
    {
      category: "Frontend Excellence",
      icon: Monitor,
      technologies: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS", "Framer Motion"],
      description: "Cutting-edge frontend technologies for exceptional user experiences",
      color: "primary",
    },
    {
      category: "Backend Power",
      icon: Code,
      technologies: ["Node.js", "GraphQL", "PostgreSQL", "Redis", "Docker"],
      description: "Robust backend architecture that scales with your vision",
      color: "accent",
    },
    {
      category: "Mobile First",
      icon: Smartphone,
      technologies: ["React Native", "Expo", "Progressive Web Apps", "Native APIs"],
      description: "Mobile-optimized experiences that work seamlessly across devices",
      color: "secondary-foreground",
    },
    {
      category: "Global Scale",
      icon: Globe,
      technologies: ["CDN", "Edge Computing", "Multi-region", "Load Balancing"],
      description: "Infrastructure designed for global reach and lightning-fast performance",
      color: "primary",
    },
  ]

  const developmentPrinciples = [
    {
      icon: Zap,
      title: "Performance First",
      metric: "99.9%",
      description: "Uptime guarantee with sub-100ms response times",
    },
    {
      icon: Shield,
      title: "Security Focused",
      metric: "Zero",
      description: "Security vulnerabilities with enterprise-grade protection",
    },
    {
      icon: Rocket,
      title: "Scalability Built-in",
      metric: "10M+",
      description: "Concurrent users supported with auto-scaling architecture",
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-background to-card/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            <Code className="w-4 h-4 mr-2" />
            Web Development Excellence
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
            Code That
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              {" "}
              Powers Dreams
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Every line of code is crafted with precision, optimized for performance, and built to scale with your
            ambitions.
          </p>
        </div>

        {/* Technology Stack Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          <div className="space-y-4">
            {techStacks.map((stack, index) => {
              const Icon = stack.icon
              return (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                    activeStack === index
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
                      : "border-muted hover:border-primary/50"
                  }`}
                  onClick={() => setActiveStack(index)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-3 rounded-xl ${
                          activeStack === index ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{stack.category}</h3>
                        <p className="text-sm text-muted-foreground">{stack.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Stack Details */}
          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-8">
              <div className="flex items-center space-x-4 mb-6">
                {React.createElement(techStacks[activeStack].icon, {
                  className: "w-12 h-12 text-primary",
                })}
                <div>
                  <h3 className="text-2xl font-bold">{techStacks[activeStack].category}</h3>
                  <p className="text-muted-foreground">{techStacks[activeStack].description}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <h4 className="text-lg font-semibold">Technologies</h4>
                <div className="flex flex-wrap gap-2">
                  {techStacks[activeStack].technologies.map((tech, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button className="w-full">
                Explore Implementation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Development Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {developmentPrinciples.map((principle, index) => {
            const Icon = principle.icon
            return (
              <Card
                key={index}
                className="border-accent/20 bg-gradient-to-br from-card to-accent/5 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 group"
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-accent" />
                  </div>
                  <div className="text-4xl font-bold text-accent mb-2">{principle.metric}</div>
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
