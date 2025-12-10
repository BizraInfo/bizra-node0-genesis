"use client"

import { useEffect, useRef } from "react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VantaEffect = any

export function VantaBackground() {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<VantaEffect>(null)

  useEffect(() => {
    if (!vantaRef.current) return

    // Dynamic import to avoid SSR issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import("vanta/dist/vanta.net.min").then((VANTA: any) => {
      if (vantaEffect.current && typeof vantaEffect.current.destroy === "function") {
        vantaEffect.current.destroy()
      }

      vantaEffect.current = VANTA.default({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0xd4af37, // Luxury Gold
        backgroundColor: 0x0a1828, // Deep Navy
        points: 8.0,
        maxDistance: 20.0,
        spacing: 18.0,
      })
    })

    return () => {
      if (vantaEffect.current && typeof vantaEffect.current.destroy === "function") {
        vantaEffect.current.destroy()
      }
    }
  }, [])

  return <div ref={vantaRef} className="fixed top-0 left-0 w-full h-full z-0" />
}

