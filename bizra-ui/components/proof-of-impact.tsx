"use client"

import { motion } from "framer-motion"
import { CheckCircle, ArrowRight, Target, Award } from "lucide-react"

export function ProofOfImpact() {
  const steps = [
    {
      icon: Target,
      title: "فعل",
      subtitle: "Action",
      description: "Contribute resources, knowledge, or effort to the ecosystem",
    },
    {
      icon: CheckCircle,
      title: "قياس",
      subtitle: "Measure",
      description: "Impact is quantified using transparent, verifiable metrics",
    },
    {
      icon: Award,
      title: "توثيق",
      subtitle: "Document",
      description: "Cryptographically signed attestations create immutable proof",
    },
    {
      icon: ArrowRight,
      title: "مكافأة",
      subtitle: "Reward",
      description: "Receive Stable and Growth tokens based on verified impact",
    },
  ]

  return (
    <section className="py-24 bg-card/20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-serif">Proof of Impact (PoI)</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A revolutionary consensus mechanism that rewards verified contributions to human flourishing, creating
            economic incentives aligned with positive impact.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <step.icon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 font-serif">{step.title}</h3>
              <h4 className="text-sm font-medium text-primary mb-4">{step.subtitle}</h4>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 md:p-12 text-center"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 font-serif">
            ImpactScore = Quality × Utility × Efficiency × Trust × Diversity
          </h3>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Every contribution is evaluated across multiple dimensions to ensure fair, comprehensive assessment of value
            creation within the BIZRA ecosystem.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
