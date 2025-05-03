
  //import { PriceAlertsTab } from "@/components/widgets"
import VerifySignatureTab from "@/components/signature-tools/verify-signature-tab"
// import { WelcomeScreen } from "@/components/welcome/index"

export default function HomePage() {
  return (
    <main className="min-h-screen">
 {/* <WelcomeScreen /> 
   <PriceAlertsTab/>  */}
      
      <VerifySignatureTab/>
    </main>
  )
}

