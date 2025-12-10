"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Rocket, Brain, Network, Zap, ArrowRight, Play } from "lucide-react"

export function InnovativeProducts() {
  const [activeProduct, setActiveProduct] = useState(0)

  const products = [
    {
      icon: Brain,
      title: "Consciousness Engine",
      description: "AI-powered system that measures and amplifies human impact through advanced neural networks",
      features: ["Real-time Impact Scoring", "Behavioral Pattern Analysis", "Consciousness Mapping"],
      status: "Live",
      color: "primary",
    },
    {
      icon: Network,
      title: "BlockGraph Network",
      description: "Revolutionary blockchain architecture that creates interconnected impact verification systems",
      features: ["Hyper-Network Topology", "Proof-of-Impact Protocol", "Distributed Consensus"],
      status: "Beta",
      color: "accent",
    },
    {
      icon: Zap,
      title: "Dual Agency Platform",
      description: "Personal and operational AI agents working in harmony to optimize human potential",
      features: ["7 Personal Agents", "Operational Automation", "Seamless Integration"],
      status: "Development",
      color: "secondary-foreground",
    },
    {
      icon: Rocket,
      title: "Impact Accelerator",
      description: "Tools and frameworks that transform individual actions into measurable global change",
      features: ["Impact Amplification", "Global Metrics", "Change Tracking"],
      status: "Concept",
      color: "primary",
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-background to-card/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            <Rocket className="w-4 h-4 mr-2" />
            Innovative Digital Products
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
            Products That
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {" "}
              Transform Reality
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Each product in the BIZRA ecosystem represents a breakthrough in digital innovation, designed to elevate
            human consciousness and create measurable impact.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Product Navigation */}
          <div className="space-y-4">
            {products.map((product, index) => {
              const Icon = product.icon
              return (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                    activeProduct === index
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
                      : "border-muted hover:border-primary/50"
                  }`}
                  onClick={() => setActiveProduct(index)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`p-3 rounded-xl ${
                          activeProduct === index ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-semibold">{product.title}</h3>
                          <Badge
                            variant={
                              product.status === "Live"
                                ? "default"
                                : product.status === "Beta"
                                  ? "secondary"
                                  : product.status === "Development"
                                    ? "outline"
                                    : "secondary"
                            }
                          >
                            {product.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">{product.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Product Details */}
          <div className="lg:sticky lg:top-8">
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="flex items-center space-x-4 mb-4">
                    {React.createElement(products[activeProduct].icon, {
                      className: "w-12 h-12 text-primary",
                    })}
                    <div>
                      <h3 className="text-2xl font-bold">{products[activeProduct].title}</h3>
                      <Badge className="mt-1">{products[activeProduct].status}</Badge>
                    </div>
                  </div>
                  <p className="text-lg text-muted-foreground mb-6">{products[activeProduct].description}</p>
                </div>

                <div className="space-y-4 mb-8">
                  <h4 className="text-lg font-semibold">Key Features</h4>
                  <div className="grid gap-3">
                    {products[activeProduct].features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    Experience Demo
                  </Button>
                  <Button variant="outline">
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
