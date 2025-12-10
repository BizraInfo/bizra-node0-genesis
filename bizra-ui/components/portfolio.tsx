"use client"

import type React from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, ArrowRight } from "lucide-react"
import { useIntersectionObserver } from "@/hooks/use-scroll"

const projects = [
  {
    title: "Luxe Commerce",
    category: "E-commerce Platform",
    description: "A sophisticated e-commerce platform for luxury brands with advanced personalization.",
    image: "/luxury-ecommerce-website-dark-elegant.jpg",
    tags: ["Next.js", "TypeScript", "Stripe", "AI"],
  },
  {
    title: "Zenith Analytics",
    category: "SaaS Dashboard",
    description: "Real-time analytics dashboard with advanced data visualization and insights.",
    image: "/modern-analytics-dashboard-dark-charts.jpg",
    tags: ["React", "D3.js", "Node.js", "PostgreSQL"],
  },
  {
    title: "Artisan Collective",
    category: "Creative Portfolio",
    description: "A stunning portfolio platform showcasing contemporary art and design.",
    image: "/creative-portfolio-website-minimal-art.jpg",
    tags: ["Framer", "WebGL", "GSAP", "CMS"],
  },
]

export function Portfolio() {
  const [elementRef, isIntersecting] = useIntersectionObserver({ threshold: 0.2 })

  return (
    <section id="portfolio" ref={elementRef} className="py-32 bg-secondary/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-balance mb-6">Featured Work</h2>
          <p className="text-xl text-muted-foreground text-pretty max-w-3xl mx-auto">
            A curated selection of our most impactful projects, each crafted with precision and purpose.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
          {projects.map((project, index) => (
            <Card
              key={project.title}
              className={`group overflow-hidden border-border/50 hover:border-primary/20 transition-all duration-500 hover:shadow-xl ${
                isIntersecting ? "animate-fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="aspect-[4/3] overflow-hidden relative">
                <Image
                  src={project.image || "/placeholder.svg"}
                  alt={project.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <CardContent className="p-6">
                <div className="text-sm text-primary font-medium mb-2">{project.category}</div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{project.title}</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="group/btn p-0 h-auto">
                  View Project
                  <ExternalLink className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" variant="outline" className="group px-8 py-6 bg-transparent">
            View All Projects
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  )
}
