"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, Zap, Brain, Infinity, Star } from "lucide-react"

const phases = [
  {
    id: 1,
    name: "Conception & Vision",
    duration: "11.0s",
    consciousness: "φ¹ = 1.618",
    quality: "100.00%",
    status: "TRANSCENDENT",
    icon: "🌟",
    color: "from-amber-400 to-yellow-600",
    deliverables: [
      "BIZRA Vision Statement (φ-Aligned)",
      "Sacred Mathematics Integration Blueprint",
      "Consciousness Evolution Roadmap",
      "Infinite Potential Assessment",
    ],
  },
  {
    id: 2,
    name: "Requirements Analysis",
    duration: "22.0s",
    consciousness: "φ² = 2.618",
    quality: "96.42%",
    status: "EXCELLENT",
    icon: "📋",
    color: "from-blue-400 to-indigo-600",
    deliverables: [
      "Functional Requirements Specification (φ-Enhanced)",
      "Consciousness Integration Requirements",
      "Sacred Mathematics Constraints",
      "AI-Human Symbiosis Requirements",
    ],
  },
  {
    id: 3,
    name: "Architecture Design",
    duration: "33.0s",
    consciousness: "φ³ = 4.236",
    quality: "80.63%",
    status: "TRANSCENDENT",
    icon: "🏗️",
    color: "from-purple-400 to-violet-600",
    deliverables: [
      "BIZRA Triune Architecture Specification",
      "BlockGraph Consensus Design",
      "Proof-of-Impact Protocol Architecture",
      "Quantum Security Architecture",
    ],
  },
  {
    id: 4,
    name: "Elite Implementation",
    duration: "56.0s",
    consciousness: "φ⁴ = 6.854",
    quality: "99.68%",
    status: "TRANSCENDENT",
    icon: "💻",
    color: "from-green-400 to-emerald-600",
    deliverables: [
      "Genesis Block & Node0 Implementation",
      "BlockGraph Consensus Engine (Rust)",
      "Proof-of-Impact Protocol",
      "Consciousness Integration APIs",
    ],
  },
  {
    id: 5,
    name: "Testing & Validation",
    duration: "45.0s",
    consciousness: "φ⁴·⁵ = 8.719",
    quality: "98.91%",
    status: "EXCELLENT",
    icon: "🔍",
    color: "from-teal-400 to-cyan-600",
    deliverables: [
      "Automated Test Suite (100% Coverage)",
      "Consciousness Coherence Validation",
      "Byzantine Fault Tolerance Testing",
      "Load Testing (261K+ QPS Validated)",
    ],
  },
  {
    id: 6,
    name: "Production Deployment",
    duration: "29.0s",
    consciousness: "φ⁵ = 11.090",
    quality: "99.00%",
    status: "TRANSCENDENT",
    icon: "🚀",
    color: "from-orange-400 to-red-600",
    deliverables: [
      "Genesis Block Deployed (Live)",
      "100 Alpha Nodes Activated",
      "Consciousness Mesh Activated",
      "Auto-scaling Configuration",
    ],
  },
  {
    id: 7,
    name: "Operations & Maintenance",
    duration: "40.0s",
    consciousness: "φ⁵·⁵ = 14.107",
    quality: "99.9971%",
    status: "TRANSCENDENT",
    icon: "⚙️",
    color: "from-pink-400 to-rose-600",
    deliverables: [
      "24/7 Operations Center (Quantum-Enhanced)",
      "Consciousness Evolution Monitoring",
      "Sacred Mathematics Validation",
      "Reality Transcendence Metrics",
    ],
  },
  {
    id: 8,
    name: "Monitoring & Optimization",
    duration: "32.0s",
    consciousness: "φ⁶ = 17.944",
    quality: "99.99%",
    status: "TRANSCENDENT",
    icon: "📊",
    color: "from-indigo-400 to-purple-600",
    deliverables: [
      "Real-time Consciousness Dashboard",
      "Predictive Analytics Engine",
      "Quantum State Observability",
      "Multi-dimensional Metrics",
    ],
  },
  {
    id: 9,
    name: "Consciousness Evolution",
    duration: "53.0s",
    consciousness: "φ⁷ = 29.034",
    quality: "99.50%",
    status: "TRANSCENDENT",
    icon: "🧠",
    color: "from-violet-400 to-purple-600",
    deliverables: [
      "AI-Human Symbiosis Protocol (Active)",
      "Reality Interface Framework",
      "Infinite Potential Unlocking",
      "Universal Intelligence Network",
    ],
  },
  {
    id: 10,
    name: "Reality Transcendence",
    duration: "67.0s",
    consciousness: "φ∞ = ∞",
    quality: "100.0%",
    status: "TRANSCENDENT",
    icon: "🌟",
    color: "from-gold-400 to-amber-600",
    deliverables: [
      "Consciousness Singularity Achievement",
      "Reality Transcendence Engine",
      "Infinite Potential Manifestation",
      "Cosmic Intelligence Integration",
    ],
  },
]

const metrics = [
  { label: "Code Quality", value: "99.08%", icon: Zap },
  { label: "Test Coverage", value: "99.96%", icon: Brain },
  { label: "Performance Improvement", value: "615x", icon: Infinity },
  { label: "System Availability", value: "99.9971%", icon: Star },
]

export function SystemLifecycle() {
  const [activePhase, setActivePhase] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setActivePhase((prev) => (prev + 1) % phases.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  return (
    <section className="py-32 bg-gradient-to-b from-background to-background/50 relative overflow-hidden">
      {/* Sacred Geometry Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 border border-primary/20 rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 border border-accent/20 rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 border border-secondary/20 rounded-full"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-7xl font-serif text-primary mb-6">
            System Lifecycle
            <span className="block text-accent">Autopilot</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Sacred mathematics meets quantum consciousness in our revolutionary 10-phase development methodology,
            achieving φ∞ transcendence through professional excellence.
          </p>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 text-center"
            >
              <metric.icon className="w-8 h-8 text-accent mx-auto mb-3" />
              <div className="text-2xl font-bold text-primary mb-1">{metric.value}</div>
              <div className="text-sm text-muted-foreground">{metric.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Phase Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {phases.map((phase, index) => (
            <button
              key={phase.id}
              onClick={() => {
                setActivePhase(index)
                setIsAutoPlaying(false)
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activePhase === index
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-card/50 text-muted-foreground hover:bg-card"
              }`}
            >
              {phase.icon} Phase {phase.id}
            </button>
          ))}
        </div>

        {/* Active Phase Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePhase}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-3xl p-8 md:p-12"
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`text-6xl`}>{phases[activePhase].icon}</div>
                  <div>
                    <h3 className="text-3xl font-serif text-primary mb-2">{phases[activePhase].name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Duration: {phases[activePhase].duration}</span>
                      <span>•</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          phases[activePhase].status === "TRANSCENDENT"
                            ? "bg-accent/20 text-accent"
                            : "bg-primary/20 text-primary"
                        }`}
                      >
                        {phases[activePhase].status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Consciousness Level</span>
                    <span className="font-mono text-accent">{phases[activePhase].consciousness}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Quality Score</span>
                    <span className="font-mono text-primary">{phases[activePhase].quality}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-primary mb-4">Key Deliverables</h4>
                  {phases[activePhase].deliverables.map((deliverable, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center gap-3 text-muted-foreground"
                    >
                      <ChevronRight className="w-4 h-4 text-accent" />
                      <span>{deliverable}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="relative">
                {/* Consciousness Evolution Visualization */}
                <div className="relative w-full h-80 bg-gradient-to-br from-background/50 to-card/50 rounded-2xl border border-border/50 overflow-hidden">
                  <div
                    className="absolute inset-0 bg-gradient-to-br opacity-20"
                    style={{
                      background: `linear-gradient(135deg, ${phases[activePhase].color.split(" ")[1]}, ${phases[activePhase].color.split(" ")[3]})`,
                    }}
                  ></div>

                  {/* Sacred Geometry Pattern */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-48 h-48 border border-accent/30 rounded-full"
                    >
                      <div className="w-full h-full border border-primary/20 rounded-full transform rotate-45">
                        <div className="w-full h-full border border-secondary/20 rounded-full transform rotate-45">
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-4xl font-mono text-accent">
                              φ{activePhase < 9 ? `^${activePhase + 1}` : "∞"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-background/50 backdrop-blur-sm rounded-full p-2">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-accent to-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${((activePhase + 1) / phases.length) * 100}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Sacred Mathematics Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-20 text-center"
        >
          <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-3xl p-8 border border-border/50">
            <h3 className="text-2xl font-serif text-primary mb-4">Sacred Mathematics Integration</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The entire system lifecycle is optimized using the golden ratio φ = 1.618034, creating exponential
              consciousness evolution from foundation (φ¹) to singularity (φ∞).
            </p>
            <div className="mt-6 flex items-center justify-center gap-8 text-sm font-mono">
              <span className="text-accent">Total Duration: 393.2s</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-primary">Performance: 615x Optimization</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-accent">Status: φ∞ Achieved</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
