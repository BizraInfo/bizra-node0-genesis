"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Smartphone, Monitor, Tablet, Star, Clock, Zap } from "lucide-react"

export function UserExperience() {
  const [activeDevice, setActiveDevice] = useState(0)

  const devices = [
    { name: "Mobile", icon: Smartphone, users: "78%" },
    { name: "Desktop", icon: Monitor, users: "65%" },
    { name: "Tablet", icon: Tablet, users: "43%" },
  ]

  const uxMetrics = [
    {
      icon: Star,
      metric: "4.9/5",
      label: "User Satisfaction",
      description: "Consistently high ratings across all user segments",
    },
    {
      icon: Clock,
      metric: "2.3s",
      label: "Load Time",
      description: "Lightning-fast performance on all devices",
    },
    {
      icon: Zap,
      metric: "94%",
      label: "Task Completion",
      description: "Users successfully complete their intended actions",
    },
  ]

  return (
    <section className="py-24 px-6 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            <Star className="w-4 h-4 mr-2" />
            User Experience Excellence
          </Badge>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            Designed for <span className="text-primary">Human Connection</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Every interaction is crafted to be intuitive, engaging, and meaningful. Our user-centered design approach
            ensures seamless experiences across all touchpoints.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Device Selection */}
          <div>
            <h3 className="text-2xl font-bold mb-6">Optimized for Every Device</h3>

            <div className="space-y-4 mb-8">
              {devices.map((device, index) => {
                const Icon = device.icon
                return (
                  <Card
                    key={index}
                    className={`p-4 cursor-pointer transition-all duration-300 ${
                      activeDevice === index ? "bg-primary/5 border-primary" : "hover:bg-card/80"
                    }`}
                    onClick={() => setActiveDevice(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-5 h-5 ${activeDevice === index ? "text-primary" : "text-muted-foreground"}`}
                        />
                        <span className="font-medium">{device.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{device.users}</div>
                        <div className="text-xs text-muted-foreground">Active Users</div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            <Button className="group">
              Try Interactive Demo
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Device Preview */}
          <div className="relative">
            <div className="aspect-[4/3] bg-gradient-to-br from-background to-card rounded-2xl p-8 flex items-center justify-center border">
              <div className="text-center">
                {(() => {
                  const Icon = devices[activeDevice].icon
                  return <Icon className="w-24 h-24 text-primary mb-4 mx-auto" />
                })()}
                <h4 className="text-xl font-semibold mb-2">{devices[activeDevice].name} Experience</h4>
                <p className="text-muted-foreground">
                  Optimized interface with {devices[activeDevice].users} user adoption rate
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* UX Metrics */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {uxMetrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <Card key={index} className="p-6 text-center hover:bg-card/80 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">{metric.metric}</div>
                <div className="font-semibold mb-2">{metric.label}</div>
                <p className="text-sm text-muted-foreground">{metric.description}</p>
              </Card>
            )
          })}
        </div>

        {/* User Testimonial */}
        <Card className="p-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-primary fill-current" />
              ))}
            </div>

            <blockquote className="text-xl md:text-2xl font-medium mb-6 text-balance">
              "BIZRA's interface is incredibly intuitive. Within minutes, I understood how to leverage the platform for
              maximum impact. The user experience is simply outstanding."
            </blockquote>

            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="font-bold text-primary">SJ</span>
              </div>
              <div className="text-left">
                <div className="font-semibold">Sarah Johnson</div>
                <div className="text-sm text-muted-foreground">Impact Director, Global Corp</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
