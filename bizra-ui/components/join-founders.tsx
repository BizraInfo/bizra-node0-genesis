"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Users, Download, Shield, Award } from "lucide-react"

export function JoinFounders() {
  const benefits = [
    {
      icon: Award,
      title: "Founding Rewards",
      description: "Exclusive founding member benefits and priority access to new features",
    },
    {
      icon: Shield,
      title: "Early Access",
      description: "First access to BIZRA client and secure resource sharing capabilities",
    },
    {
      icon: Users,
      title: "Impact Pioneers",
      description: "Join the first 100 users building the largest distributed human impact network",
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-serif">
            دعوة المشاركة | Join the Founding 100
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Be among the first 100 users to join BIZRA and help establish the world's largest distributed human impact
            network. Genesis Block 0 is live and waiting.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <benefit.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4 font-serif">{benefit.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 md:p-12 text-center"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-6 font-serif">Ready to Plant Your Seed?</h3>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Download the BIZRA client, activate secure resource sharing, and start earning rewards based on your
            verified impact. Every human is a node, every node is a seed, and every seed has infinite potential.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg">
              <Download className="w-5 h-5 mr-2" />
              Download BIZRA Client
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg bg-transparent">
              <Users className="w-5 h-5 mr-2" />
              View Whitepaper
            </Button>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Available Spots</p>
              <p className="font-bold text-primary text-xl">100 Founding Members</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Network Status</p>
              <p className="font-bold text-secondary text-xl">Genesis Block Live</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Contact</p>
              <p className="font-mono text-foreground">m.beshr@bizra.ai</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
