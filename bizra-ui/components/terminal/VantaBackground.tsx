"use client"

import { useEffect, useRef } from 'react'

export function VantaBackground() {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && vantaRef.current) {
      // Load Vanta.js NET effect
      import('vanta/dist/vanta.net.min').then((VANTA: any) => {
        if (vantaRef.current && !vantaEffect.current) {
          vantaEffect.current = VANTA.default({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0xd4af37, // Luxury Gold
            backgroundColor: 0x0a1828, // Deep Navy
            points: 8.00,
            maxDistance: 20.00,
            spacing: 18.00
          })
        }
      })
    }

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy()
        vantaEffect.current = null
      }
    }
  }, [])

  return (
    <div
      ref={vantaRef}
      className="fixed top-0 left-0 w-full h-full z-0"
      id="vanta-bg"
    />
  )
}
