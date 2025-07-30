"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { StarBackground } from "@/components/effects/star-background"
import { ArrowLeft, Rocket } from "lucide-react"

interface CosmicErrorPageProps {
  errorCode?: string
  title?: string
  message?: string
}

export function CosmicErrorPage({
  errorCode = "404",
  title = "Lost in the Cosmic Void",
  message = "This page has been pulled into a wormhole and transported to another dimension. Our astronomers are working on finding it.",
}: CosmicErrorPageProps) {
  const router = useRouter()

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  }

  const pulseGlow = {
    animate: {
      textShadow: [
        "0 0 8px #9f7aea, 0 0 20px #9f7aea, 0 0 30px #9f7aea",
        "0 0 12px #7f5af0, 0 0 25px #7f5af0, 0 0 40px #7f5af0",
        "0 0 8px #9f7aea, 0 0 20px #9f7aea, 0 0 30px #9f7aea",
      ],
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "loop" as const,
        ease: "easeInOut",
      },
    },
  }

  // Floating astronaut animation
  const floatAnimation = {
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        repeatType: "loop" as const,
        ease: "easeInOut",
      },
    },
  }

  // Orbit lines animation (simple rotating SVG group with glow and spring effect)
  const orbitAnimation = {
    animate: {
      rotate: 360,
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "linear",
      },
    },
  }

// Positions and radii for 5 orbit circles with descending positions for smaller circles
const orbitCircles = [
  { r: 140, cx: 150, cy: 150, stroke: "rgba(159, 122, 234, 3)", strokeWidth: 2, filter: "drop-shadow(0 0 0px rgba(159, 122, 234, 5))" }, // Strong glow for outermost circle
  { r: 115, cx: 150, cy: 170, stroke: "rgba(127, 90, 240, 0.6)", strokeWidth: 1.6, filter: "drop-shadow(0 0 0px rgba(127, 90, 240, 1))" }, 
  { r: 90, cx: 150, cy: 190, stroke: "rgba(159, 122, 234, 0.5)", strokeWidth: 1.3, filter: "drop-shadow(0 0 0px rgba(159, 122, 234, 0.8))" }, 
  { r: 65, cx: 150, cy: 210, stroke: "rgba(127, 90, 240, 0.4)", strokeWidth: 1.1, filter: "drop-shadow(0 0 0px rgba(127, 90, 240, 0.8))" }, 
  { r: 40, cx: 150, cy: 230, stroke: "rgba(159, 122, 234, 0.3)", strokeWidth: 1, filter: "drop-shadow(0 0 0px rgba(159, 122, 234, 0.6))" }, 
]

  return (
    <div className="relative w-full min-h-screen  flex items-center justify-center p-6 text-gray-200">
      <StarBackground />

      <motion.div
        className="relative max-w-5xl w-full p-10 flex flex-col items-center gap-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Centered text content */}
        <div className="flex flex-col items-center text-center z-10 relative">
          <motion.h1
            className="text-[10rem] font-extrabold select-none"
            {...pulseGlow}
          >
            {errorCode}
          </motion.h1>
          <motion.h2
            className="text-3xl font-semibold -mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
          >
            {title}
          </motion.h2>
          <motion.p
            className="max-w-md text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
          >
            {message}
          </motion.p>

          <motion.div
            className="flex space-x-6 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
          >
            <Button
              variant="secondary"
              className="bg-gradient-to-r from-purple-700 to-blue-900 shadow-lg shadow-purple-700/50 hover:from-purple-700 hover:to-purple-900 transition-colors flex items-center space-x-2 rounded-4xl"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Return to Home</span>
            </Button>
            <Button
              variant="default"
              className="bg-gradient-to-r from-blue-700 to-green-900 shadow-lg shadow-blue-600/50 hover:from-blue-600 hover:to-blue-800 transition-colors flex items-center space-x-2 rounded-4xl"
              onClick={() => router.push("/dashboard")}
            >
              <Rocket className="w-5 h-5" />
              <span>Go to Dashboard</span>
            </Button>
          </motion.div>
        </div>

        <motion.svg
  className="absolute top-1/2 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
  viewBox="0 0 300 300"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  {...orbitAnimation}
>
  {orbitCircles.map(({ r, cx, cy, stroke, strokeWidth, filter }, index) => (
    <circle
      key={index}
      cx={cx}
      cy={cy}
      r={r}
      stroke={stroke}
      strokeWidth={strokeWidth}
      style={{ filter }} // Apply the shadow filter matching the circle color
    />
  ))}
</motion.svg>

        {/* Floating astronaut at bottom right with glow and reduced size, hidden on small devices */}
        <motion.div
          className="absolute bottom-6 right-6 w-28 h-28 md:w-32 md:h-32 z-10 hidden sm:block"
          {...floatAnimation}
          style={{ filter: "drop-shadow(0 0 8px #9f7aea)" }}
        >
          <Image
            src="/images/astronaut.svg"
            alt="Floating Astronaut"
            fill
            style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }}
            priority
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
