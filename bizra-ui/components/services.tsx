"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Palette, Code, Zap, Globe, Smartphone, BarChart3 } from "lucide-react"

const services = [
  {
    icon: Palette,
    title: "Brand & Design",
    description: "Sophisticated visual identities that resonate with your audience and elevate your brand presence.",
  },
  {
    icon: Code,
    title: "Development",
    description: "Cutting-edge web applications built with the latest technologies and best practices.",
  },
  {
    icon: Zap,
    title: "Performance",
    description: "Lightning-fast experiences optimized for speed, accessibility, and user engagement.",
  },
  {
    icon: Globe,
    title: "Digital Strategy",
    description: "Comprehensive digital strategies that drive growth and maximize your online impact.",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Responsive designs that deliver exceptional experiences across all devices and platforms.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Data-driven insights and optimization strategies to continuously improve performance.",
  },
]

export function Services() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 },
    )

    const element = document.getElementById("services")
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <section id="services" className="py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-balance mb-6">Excellence in Every Detail</h2>
          <p className="text-xl text-muted-foreground text-pretty max-w-3xl mx-auto">
            Our comprehensive suite of services ensures your digital presence stands apart from the competition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <Card
                key={service.title}
                className={`group hover:shadow-lg transition-all duration-500 border-border/50 hover:border-primary/20 ${
                  isVisible ? "animate-fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-foreground">{service.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
