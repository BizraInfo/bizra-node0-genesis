"use client"

import { motion } from "framer-motion"
import { Brain, Network, Zap, Shield } from "lucide-react"

export function HumanOS() {
  const features = [
    {
      icon: Brain,
      title: "نظام تشغيل إنساني",
      subtitle: "Human Operating System",
      description:
        "A revolutionary system that makes measurable impact the foundation of economic value, transforming how humans interact with technology.",
    },
    {
      icon: Network,
      title: "شبكة فائقة",
      subtitle: "Hyper-Network",
      description:
        "BlockGraph/BlockTree architecture enabling parallel processing and partial ordering for unprecedented scalability.",
    },
    {
      icon: Zap,
      title: "أثر قابل للقياس",
      subtitle: "Measurable Impact",
      description:
        "Every action is measured, documented, and rewarded based on verified contribution to human flourishing.",
    },
    {
      icon: Shield,
      title: "سيادة المستخدم",
      subtitle: "User Sovereignty",
      description:
        "Complete data ownership with privacy by default, transparent operations, and protection from exploitation.",
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-background to-background/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-serif">بِذرة | BIZRA</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A Human Operating System that transforms measurable impact into economic value, creating a decentralized
            ecosystem where every seed of contribution grows into infinite potential.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 hover:bg-card/70 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 font-serif">{feature.title}</h3>
              <h4 className="text-sm font-medium text-primary mb-4">{feature.subtitle}</h4>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
