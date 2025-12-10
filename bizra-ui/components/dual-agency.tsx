"use client"

import { motion } from "framer-motion"
import { User, Settings, Brain, Code, Search, Shield, Users } from "lucide-react"

export function DualAgency() {
  const personalAgents = [
    { icon: Brain, name: "Think", description: "Strategic reasoning and planning" },
    { icon: Code, name: "Execute", description: "Implementation and automation" },
    { icon: Search, name: "Research", description: "Knowledge discovery and analysis" },
    { icon: Shield, name: "Guard", description: "Security and privacy protection" },
    { icon: Users, name: "Coordinate", description: "Multi-agent orchestration" },
  ]

  const opsAgents = [
    { icon: Shield, name: "Security", description: "System protection and monitoring" },
    { icon: Settings, name: "Operations", description: "Infrastructure management" },
    { icon: Search, name: "Observability", description: "Performance monitoring" },
    { icon: Users, name: "Balance", description: "Resource optimization" },
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
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-serif">وكالة مزدوجة | Dual Agency</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A sophisticated AI agent ecosystem with personal agents for each user and operational agents managing the
            entire system infrastructure.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Personal Agency */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8"
          >
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mr-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground font-serif">Personal Agency</h3>
                <p className="text-muted-foreground">Your dedicated AI team</p>
              </div>
            </div>

            <div className="space-y-4">
              {personalAgents.map((agent, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center p-4 bg-background/50 rounded-xl"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                    <agent.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{agent.name}</h4>
                    <p className="text-sm text-muted-foreground">{agent.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Operations Agency */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8"
          >
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mr-4">
                <Settings className="w-8 h-8 text-secondary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground font-serif">Operations Agency</h3>
                <p className="text-muted-foreground">System infrastructure management</p>
              </div>
            </div>

            <div className="space-y-4">
              {opsAgents.map((agent, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center p-4 bg-background/50 rounded-xl"
                >
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mr-4">
                    <agent.icon className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{agent.name}</h4>
                    <p className="text-sm text-muted-foreground">{agent.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 text-center bg-gradient-to-r from-primary/5 to-secondary/5 rounded-3xl p-8"
        >
          <h4 className="text-xl font-bold text-foreground mb-4 font-serif">
            Current Status: ~750 Agents, 18 Clusters, 99.9% Uptime
          </h4>
          <p className="text-muted-foreground">
            Live production orchestra with real-time monitoring and SLO achievement
          </p>
        </motion.div>
      </div>
    </section>
  )
}
