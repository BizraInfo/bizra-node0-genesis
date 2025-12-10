"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, TrendingUp, Users, Zap, Target } from "lucide-react"

export function CampaignShowcase() {
  const [activeCampaign, setActiveCampaign] = useState(0)

  const campaigns = [
    {
      title: "Genesis Launch",
      subtitle: "The First 100 Founders",
      description:
        "An exclusive campaign to onboard the founding members who will shape the future of impact-based economics.",
      metrics: {
        engagement: "94%",
        conversion: "23%",
        reach: "50K+",
      },
      status: "Live",
      color: "primary",
      icon: Users,
    },
    {
      title: "Impact Amplification",
      subtitle: "Scale Your Influence",
      description:
        "Transform individual actions into measurable global impact through our revolutionary Proof-of-Impact system.",
      metrics: {
        engagement: "87%",
        conversion: "31%",
        reach: "125K+",
      },
      status: "Active",
      color: "accent",
      icon: TrendingUp,
    },
    {
      title: "Quantum Acceleration",
      subtitle: "Next-Gen Performance",
      description:
        "Experience 615x performance improvements through quantum-enhanced processing and sacred mathematics optimization.",
      metrics: {
        engagement: "91%",
        conversion: "28%",
        reach: "75K+",
      },
      status: "Coming Soon",
      color: "secondary",
      icon: Zap,
    },
  ]

  return (
    <section className="py-24 px-6 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            <Target className="w-4 h-4 mr-2" />
            Campaign Excellence
          </Badge>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            Driving <span className="text-primary">Engagement</span> at Scale
          </h2>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Our data-driven campaigns consistently deliver exceptional results, converting awareness into meaningful
            action and lasting impact.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {campaigns.map((campaign, index) => {
            const Icon = campaign.icon
            return (
              <Card
                key={index}
                className={`p-6 cursor-pointer transition-all duration-300 ${
                  activeCampaign === index
                    ? "bg-primary/5 border-primary shadow-xl scale-105"
                    : "hover:bg-card/80 hover:scale-102"
                }`}
                onClick={() => setActiveCampaign(index)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-${campaign.color}/20 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${campaign.color}`} />
                    </div>
                    <Badge variant={campaign.status === "Live" ? "default" : "secondary"}>{campaign.status}</Badge>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-2">{campaign.title}</h3>
                <p className="text-primary font-medium mb-3">{campaign.subtitle}</p>
                <p className="text-sm text-muted-foreground mb-6">{campaign.description}</p>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{campaign.metrics.engagement}</div>
                    <div className="text-xs text-muted-foreground">Engagement</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-accent">{campaign.metrics.conversion}</div>
                    <div className="text-xs text-muted-foreground">Conversion</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{campaign.metrics.reach}</div>
                    <div className="text-xs text-muted-foreground">Reach</div>
                  </div>
                </div>

                <Button variant={activeCampaign === index ? "default" : "outline"} className="w-full group">
                  View Campaign
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Card>
            )
          })}
        </div>

        {/* Featured Campaign Details */}
        <Card className="p-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="mb-4">Featured Campaign</Badge>
              <h3 className="text-3xl font-bold mb-4">{campaigns[activeCampaign].title}</h3>
              <p className="text-lg text-muted-foreground mb-6">{campaigns[activeCampaign].description}</p>

              <div className="flex items-center gap-4">
                <Button size="lg" className="group">
                  Join Campaign
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-background to-card rounded-xl p-6 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-2xl font-bold mb-2">Campaign Performance</div>
                  <div className="text-muted-foreground">Real-time analytics dashboard</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
