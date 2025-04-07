"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"
import { useScroll } from "framer-motion"
import { StarBackground } from "@/components/effects/star-background"
import { ShootingStarsEffect } from "@/components/effects/shooting-stars-effect"
import { Header } from "./header"
import { HeroSection } from "./hero-section"
import { FeatureSection } from "./feature-section"
import { CTASection } from "./cta-section"
import { Footer } from "./footer"
import { useMobile } from "@/hooks/use-mobile"
import { useCreateWallet } from "@/hooks/use-create-wallet"

export function WelcomeScreen() {
  const router = useRouter()
  const isMobile = useMobile()
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  const { createWallet, isCreating } = useCreateWallet()

  const handleCreateWallet = async () => {
    console.log("🛠 Wallet creation started...");
    const wallet = await createWallet();
  
    if (!wallet) {
      console.log("❌ Wallet creation failed or returned null");
      return;
    }
  
    console.log("✅ Wallet created:", wallet);
    console.log("🔁 Redirecting to /dashboard...");
    router.push("/dashboard");
  };
  

  return (
    <div ref={containerRef} className="relative w-full min-h-screen bg-[#0A0A1A] text-white overflow-hidden">
      <StarBackground />
      <ShootingStarsEffect />
      
      <Header onCreateWallet={handleCreateWallet} isCreating={isCreating} />
      <HeroSection scrollYProgress={scrollYProgress} />
      <FeatureSection />
      <CTASection onCreateWallet={handleCreateWallet} isCreating={isCreating} />
      <Footer />
    </div>
  )
}
