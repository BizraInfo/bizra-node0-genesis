"use client"

import { useEffect, useState } from "react"

const metrics = [
  { value: "150+", label: "Projects Delivered", suffix: "" },
  { value: "98", label: "Client Satisfaction", suffix: "%" },
  { value: "5x", label: "Performance Increase", suffix: "" },
  { value: "24/7", label: "Support Available", suffix: "" },
]

export function Metrics() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 },
    )

    const element = document.getElementById("metrics")
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <section id="metrics" className="py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className={`text-center transition-all duration-700 delay-${index * 100} ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="text-4xl md:text-5xl font-bold font-serif text-primary mb-2">
                {metric.value}
                {metric.suffix}
              </div>
              <div className="text-sm md:text-base text-muted-foreground font-medium">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
