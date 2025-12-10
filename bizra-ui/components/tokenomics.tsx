"use client"

import { motion } from "framer-motion"
import { Coins, TrendingUp, Database } from "lucide-react"

export function Tokenomics() {
  const tokens = [
    {
      icon: Coins,
      name: "Stable Token",
      purpose: "Exchange & Stability",
      description: "Medium of exchange for fees, incentives, and service payments within the ecosystem",
    },
    {
      icon: TrendingUp,
      name: "Growth Token",
      purpose: "Value & Expansion",
      description: "Growth value tied to impact and network expansion, rewarding long-term contribution",
    },
  ]

  const metrics = [
    { label: "Data Contribution", value: "~49-52GB", description: "Signed, no raw disclosure" },
    { label: "Performance Delta", value: "+32.8%", description: "Internal measurements" },
    { label: "Network Multiplier", value: "Active", description: "Based on ecosystem growth" },
    { label: "Impact Verification", value: "Live", description: "Cryptographically signed" },
  ]

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-serif">
            اقتصاد بِذرة | BIZRA Economics
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A dual-token economy supported by a Unified Resource Pool (URP) that distributes returns based on verified
            ImpactScore and network contribution.
          </p>
        </motion.div>

        {/* Token Types */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {tokens.map((token, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8"
            >
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mr-4">
                  <token.icon className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground font-serif">{token.name}</h3>
                  <p className="text-primary font-medium">{token.purpose}</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">{token.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Unified Resource Pool */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 mb-16"
        >
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mr-4">
              <Database className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground font-serif">Unified Resource Pool (URP)</h3>
              <p className="text-muted-foreground">Aggregated Compute/Data/Tools with impact-based pricing</p>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            The URP aggregates contributions of compute power, data, and tools from network participants, pricing
            resources based on consumption and impact, then distributing returns according to verified ImpactScore and
            network multipliers.
          </p>
        </motion.div>

        {/* Current Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8"
        >
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center font-serif">Current Network Metrics</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">{metric.value}</div>
                <div className="font-semibold text-foreground mb-1">{metric.label}</div>
                <div className="text-sm text-muted-foreground">{metric.description}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Reward Formula */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <h4 className="text-xl font-bold text-foreground mb-4 font-serif">Reward Distribution Formula</h4>
          <div className="bg-card/30 rounded-2xl p-6 font-mono text-lg">
            <span className="text-primary">Rewards</span> =<span className="text-secondary"> ImpactScore</span> ×
            <span className="text-accent"> NetworkMultiplier</span> ×
            <span className="text-muted-foreground"> (Protection Limits + Fairness Adjustments)</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
