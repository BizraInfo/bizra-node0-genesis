"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Target } from "lucide-react"

export function AdvancedTokenomics() {
  const [activeToken, setActiveToken] = useState<"stable" | "growth">("stable")
  const [simulationActive, setSimulationActive] = useState(false)

  const tokenData = {
    stable: {
      name: "BIZRA Stable (BZS)",
      symbol: "BZS",
      purpose: "Stability & Transactions",
      supply: "Dynamic",
      backing: "Impact Reserves",
      features: ["Price Stability", "Transaction Medium", "Impact Backing", "Governance Rights"],
      metrics: {
        price: "$1.00",
        volatility: "< 2%",
        volume: "$2.4M",
        holders: "1,247",
      },
    },
    growth: {
      name: "BIZRA Growth (BZG)",
      symbol: "BZG",
      purpose: "Growth & Rewards",
      supply: "Fixed 21M",
      backing: "Network Value",
      features: ["Value Appreciation", "Staking Rewards", "Network Governance", "Impact Multiplier"],
      metrics: {
        price: "$12.47",
        volatility: "15-25%",
        volume: "$890K",
        holders: "892",
      },
    },
  }

  const economicFlow = [
    { stage: "Impact Creation", percentage: 100, description: "Users generate verified positive impact" },
    { stage: "Verification", percentage: 85, description: "AI agents validate and score impact" },
    { stage: "Token Minting", percentage: 70, description: "Tokens minted based on verified impact" },
    { stage: "Value Distribution", percentage: 55, description: "Rewards distributed to stakeholders" },
    { stage: "Ecosystem Growth", percentage: 40, description: "Network effects amplify total value" },
  ]

  return (
    <section className="py-32 px-6 bg-gradient-to-b from-card/20 to-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <Badge variant="outline" className="mb-6 px-4 py-2 text-sm border-accent/30">
            AKQA Economic Innovation
          </Badge>
          <h2 className="text-5xl md:text-6xl font-serif text-balance mb-6">
            Advanced
            <span className="text-accent"> Tokenomics</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Revolutionary dual-token economy that balances stability with growth, creating sustainable value from
            verified human impact.
          </p>
        </div>

        {/* Token Selection */}
        <div className="flex justify-center mb-12">
          <div className="flex bg-card/50 rounded-2xl p-2 border border-border/50">
            <Button
              variant={activeToken === "stable" ? "default" : "ghost"}
              onClick={() => setActiveToken("stable")}
              className={`px-8 py-3 rounded-xl transition-all duration-300 ${
                activeToken === "stable"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Stable Token
            </Button>
            <Button
              variant={activeToken === "growth" ? "default" : "ghost"}
              onClick={() => setActiveToken("growth")}
              className={`px-8 py-3 rounded-xl transition-all duration-300 ${
                activeToken === "growth"
                  ? "bg-accent text-accent-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Growth Token
            </Button>
          </div>
        </div>

        {/* Token Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    activeToken === "stable" ? "bg-primary/20" : "bg-accent/20"
                  }`}
                >
                  <span className={`text-xl font-bold ${activeToken === "stable" ? "text-primary" : "text-accent"}`}>
                    {tokenData[activeToken].symbol}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{tokenData[activeToken].name}</h3>
                  <p className="text-muted-foreground">{tokenData[activeToken].purpose}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Supply</p>
                  <p className="font-semibold">{tokenData[activeToken].supply}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Backing</p>
                  <p className="font-semibold">{tokenData[activeToken].backing}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-accent">Key Features:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {tokenData[activeToken].features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="justify-center py-2">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Live Metrics */}
          <Card className="p-8 bg-card/50 border-border/50">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-accent" />
              Live Metrics
            </h3>

            <div className="space-y-6">
              {Object.entries(tokenData[activeToken].metrics).map(([key, value], index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="capitalize text-muted-foreground">{key}</span>
                  <span className="font-semibold text-lg">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-border/50">
              <Button
                className="w-full bg-accent hover:bg-accent/90"
                onClick={() => setSimulationActive(!simulationActive)}
              >
                {simulationActive ? "Stop" : "Start"} Economic Simulation
              </Button>
            </div>
          </Card>
        </div>

        {/* Economic Flow Visualization */}
        <Card className="p-8 bg-gradient-to-r from-background/50 to-card/50 border-primary/20 mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">Impact-to-Value Flow</h3>

          <div className="space-y-6">
            {economicFlow.map((stage, index) => (
              <div key={index} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{stage.stage}</span>
                  <span className="text-sm text-accent">{stage.percentage}%</span>
                </div>
                <Progress value={simulationActive ? stage.percentage : 0} className="h-3 mb-2" />
                <p className="text-sm text-muted-foreground">{stage.description}</p>

                {index < economicFlow.length - 1 && (
                  <div className="flex justify-center my-4">
                    <TrendingDown className="h-4 w-4 text-accent" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Economic Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Target,
              title: "Impact-First Economics",
              description: "Value creation directly tied to measurable positive impact on humanity and environment.",
              metric: "100% Verified",
            },
            {
              icon: PieChart,
              title: "Balanced Dual System",
              description: "Stable token for transactions, growth token for appreciation - optimal economic balance.",
              metric: "2 Token Types",
            },
            {
              icon: TrendingUp,
              title: "Sustainable Growth",
              description: "Network effects and impact amplification create exponential value without speculation.",
              metric: "∞ Potential",
            },
          ].map((principle, index) => {
            const Icon = principle.icon
            return (
              <Card
                key={index}
                className="p-6 text-center bg-card/50 border-border/50 hover:bg-card/80 transition-all duration-300"
              >
                <Icon className="h-12 w-12 text-accent mx-auto mb-4" />
                <div className="text-2xl font-bold text-primary mb-2">{principle.metric}</div>
                <h3 className="text-lg font-semibold mb-3">{principle.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{principle.description}</p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
