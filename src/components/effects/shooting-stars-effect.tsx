"use client"

import { useEffect, useRef } from "react"

export function ShootingStarsEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Shooting star properties
    const shootingStars: {
      x: number
      y: number
      length: number
      speed: number
      size: number
      color: string
      active: boolean
      trail: { x: number; y: number; alpha: number }[]
      timeToNextActive: number
    }[] = []

    // Create shooting stars pool
    const starCount = 10
    const colors = ["#ffffff", "#f0f0ff", "#e0e0ff", "#d0d0ff"]

    for (let i = 0; i < starCount; i++) {
      shootingStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5,
        length: Math.random() * 80 + 50,
        speed: Math.random() * 5 + 3,
        size: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        active: false,
        trail: [],
        timeToNextActive: Math.random() * 5000 + 2000, // Random time between 2-7 seconds
      })
    }

    let lastTime = 0
    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastTime
      lastTime = timestamp

      // Clear the entire canvas completely instead of using a semi-transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw shooting stars
      shootingStars.forEach((star) => {
        // Update time to next activation
        if (!star.active) {
          star.timeToNextActive -= deltaTime
          if (star.timeToNextActive <= 0) {
            // Activate star
            star.active = true
            star.x = Math.random() * canvas.width * 0.3
            star.y = Math.random() * canvas.height * 0.3
            star.trail = []
            star.timeToNextActive = Math.random() * 8000 + 5000 // Random time between 5-13 seconds
          }
        }

        // Update active shooting stars
        if (star.active) {
          // Move star
          star.x += star.speed * 1.5
          star.y += star.speed

          // Add to trail
          star.trail.unshift({ x: star.x, y: star.y, alpha: 1 })

          // Limit trail length
          if (star.trail.length > 20) {
            star.trail.pop()
          }

          // Draw trail
          star.trail.forEach((point, index) => {
            const alpha = 1 - index / star.trail.length
            ctx.beginPath()
            ctx.arc(point.x, point.y, star.size * (1 - index / star.trail.length), 0, Math.PI * 2)
            ctx.fillStyle = star.color.replace(")", `, ${alpha})`).replace("rgb", "rgba")
            ctx.fill()
          })

          // Draw star head
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size * 1.5, 0, Math.PI * 2)
          ctx.fillStyle = star.color
          ctx.fill()

          // Add glow effect
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2)
          const gradient = ctx.createRadialGradient(star.x, star.y, star.size, star.x, star.y, star.size * 4)
          gradient.addColorStop(0, star.color.replace(")", ", 0.3)").replace("rgb", "rgba"))
          gradient.addColorStop(1, star.color.replace(")", ", 0)").replace("rgb", "rgba"))
          ctx.fillStyle = gradient
          ctx.fill()

          // Deactivate if off screen
          if (star.x > canvas.width || star.y > canvas.height) {
            star.active = false
            star.trail = [] // Clear trail when star is deactivated
          }
        }
      })

      requestAnimationFrame(animate)
    }

    const animationId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-0" />
}

