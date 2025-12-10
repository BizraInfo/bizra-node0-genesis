import { useEffect, useRef, useCallback, useState } from "react"
import type React from "react"

/**
 * Custom hook for handling scroll events with passive listeners
 * @param callback - Function to call on scroll
 * @param enabled - Whether the listener should be active
 */
export function useScroll(callback: (scrollY: number) => void, enabled = true) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    const handleScroll = () => {
      callbackRef.current(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [enabled])
}

/**
 * Custom hook for interval management
 * @param callback - Function to call on interval
 * @param delay - Delay in milliseconds (null to pause)
 */
export function useInterval(callback: () => void, delay: number | null) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return

    const id = setInterval(() => {
      callbackRef.current()
    }, delay)

    return () => clearInterval(id)
  }, [delay])
}

/**
 * Custom hook for debounced values
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Custom hook for animation timing
 * @param targetValue - Target value to animate to
 * @param duration - Animation duration in milliseconds
 */
export function useAnimatedValue(
  targetValue: number,
  duration: number = 1000,
): number {
  const [currentValue, setCurrentValue] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const startValueRef = useRef(0)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    startValueRef.current = currentValue
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const newValue = startValueRef.current + (targetValue - startValueRef.current) * easeOut

      setCurrentValue(newValue)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        setCurrentValue(targetValue)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [targetValue, duration])

  return currentValue
}

/**
 * Custom hook for intersection observer
 * @param options - IntersectionObserver options
 */
export function useIntersectionObserver(
  options?: IntersectionObserverInit,
): [React.RefObject<HTMLElement>, boolean] {
  const elementRef = useRef<HTMLElement>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      options,
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [options])

  return [elementRef, isIntersecting]
}

