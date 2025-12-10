"use client"

import { motion } from "framer-motion"
import { Database, Network, Cpu, Lock } from "lucide-react"

export function Architecture() {
  const layers = [
    {
      icon: Cpu,
      title: "Intelligence Layer",
      subtitle: "LLM & Agents",
      features: ["HRM (Hierarchical Memory)", "MoE (Mixture of Experts)", "Hypergraph RAG", "RL + AutoDecoder"],
    },
    {
      icon: Network,
      title: "Network Layer",
      subtitle: "BlockGraph/BlockTree",
      features: ["DAG/BlockTree Structure", "Parallel Processing", "Merkle Roots", "WQ-refs for Finality"],
    },
    {
      icon: Database,
      title: "Verification Layer",
      subtitle: "PoI Attestation",
      features: ["Ed25519 Signatures", "Genesis Linking", "Local Validation API", "Impact Chains"],
    },
    {
      icon: Lock,
      title: "Security Layer",
      subtitle: "Privacy & Protection",
      features: ["SHA-256 Hashing", "XChaCha20-Poly1305", "Zero-Knowledge Proofs", "Local-First Data"],
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
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-serif">
            المعمارية التقنية | Technical Architecture
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A sophisticated multi-layer architecture combining advanced AI, distributed networks, and cryptographic
            verification systems.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {layers.map((layer, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 hover:bg-card/70 transition-all duration-300"
            >
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mr-4">
                  <layer.icon className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground font-serif">{layer.title}</h3>
                  <p className="text-primary font-medium">{layer.subtitle}</p>
                </div>
              </div>

              <ul className="space-y-3">
                {layer.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-muted-foreground">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 text-center"
        >
          <h4 className="text-2xl font-bold text-foreground mb-4 font-serif">Genesis Block 0 Live | Node 0 Active</h4>
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Chain ID</p>
              <p className="font-mono text-foreground">bizra-main-alpha</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Merkle Root</p>
              <p className="font-mono text-foreground">d9c9...926f</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Performance Delta</p>
              <p className="font-mono text-primary">+32.8%</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
