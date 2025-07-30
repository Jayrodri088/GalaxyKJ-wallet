"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

export function StellarBlockchainIllustration() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return


    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)


    const nodes: {
      x: number
      y: number
      radius: number
      color: string
      connections: number[]
      speed: { x: number; y: number }
    }[] = []


    const nodeCount = 12
    const colors = ["#4F46E5", "#7C3AED", "#3B82F6", "#9333EA"]

    for (let i = 0; i < nodeCount; i++) {
      const radius = Math.random() * 4 + 4
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius,
        color: colors[Math.floor(Math.random() * colors.length)],
        connections: [],
        speed: {
          x: (Math.random() - 0.5) * 0.5,
          y: (Math.random() - 0.5) * 0.5,
        },
      })
    }


    nodes.forEach((node, i) => {
      const connectionCount = Math.floor(Math.random() * 3) + 2
      for (let j = 0; j < connectionCount; j++) {
        let targetIndex
        do {
          targetIndex = Math.floor(Math.random() * nodeCount)
        } while (targetIndex === i || node.connections.includes(targetIndex))
        node.connections.push(targetIndex)
      }
    })


    let animationFrameId: number
    let particleTime = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particleTime += 0.005


      nodes.forEach((node) => {
        node.connections.forEach((targetIndex) => {
          const target = nodes[targetIndex]
          ctx.beginPath()
          ctx.moveTo(node.x, node.y)
          ctx.lineTo(target.x, target.y)


          const gradient = ctx.createLinearGradient(node.x, node.y, target.x, target.y)
          gradient.addColorStop(0, node.color.replace(")", ", 0.2)").replace("rgb", "rgba"))
          gradient.addColorStop(1, target.color.replace(")", ", 0.2)").replace("rgb", "rgba"))

          ctx.strokeStyle = gradient
          ctx.lineWidth = 1
          ctx.stroke()


          const particleCount = 1
          for (let p = 0; p < particleCount; p++) {
            const offset = p / particleCount
            const t = (particleTime + offset) % 1

            const x = node.x + (target.x - node.x) * t
            const y = node.y + (target.y - node.y) * t

            ctx.beginPath()
            ctx.arc(x, y, 1.5, 0, Math.PI * 2)
            ctx.fillStyle = "#ffffff"
            ctx.fill()
          }
        })
      })


      nodes.forEach((node) => {

        node.x += node.speed.x
        node.y += node.speed.y

        if (node.x < node.radius || node.x > canvas.width - node.radius) {
          node.speed.x *= -1
        }
        if (node.y < node.radius || node.y > canvas.height - node.radius) {
          node.speed.y *= -1
        }


        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
        ctx.fillStyle = node.color
        ctx.fill()


        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius * 2, 0, Math.PI * 2)
        const gradient = ctx.createRadialGradient(node.x, node.y, node.radius, node.x, node.y, node.radius * 2)
        gradient.addColorStop(0, node.color.replace(")", ", 0.3)").replace("rgb", "rgba"))
        gradient.addColorStop(1, node.color.replace(")", ", 0)").replace("rgb", "rgba"))
        ctx.fillStyle = gradient
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="w-full h-full" />
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.5)]">
          <span className="text-white font-bold text-xl">GW</span>
        </div>
      </motion.div>
    </div>
  )
}

