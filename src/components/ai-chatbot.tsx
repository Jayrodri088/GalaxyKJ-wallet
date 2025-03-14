"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Send, Bot, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"


const predefinedQuestions = [
  "How do I reset my private key?",
  "How do I perform a swap on Stellar?",
  "What security measures does Galaxy Wallet offer?",
  "How do I set up automatic payments?",
  "How do I recover my seed phrase?",
]


const sampleResponses: Record<string, string> = {
    "How do I reset my private key?":
      "To reset your private key, you'll need your 12-word seed phrase. Follow these steps:\n\n1. Go to the home screen\n2. Select 'Recover Wallet'\n3. Enter your seed phrase\n4. Create a new password\n\nRemember that without your seed phrase, you won't be able to reset your private key due to the decentralized nature of the blockchain.",
  
    "How do I perform a swap on Stellar?":
      "To perform a swap on Stellar with Galaxy Wallet:\n\n1. Go to the 'Swap' section in the main menu\n2. Select the asset you want to exchange (source)\n3. Select the asset you want to receive (destination)\n4. Enter the amount to exchange\n5. Review the quote and fees\n6. Confirm the transaction\n\nThe swap will be performed automatically through the Stellar DEX, which guarantees the best available rates.",
  
    "What security measures does Galaxy Wallet offer?":
      "Galaxy Wallet offers multiple layers of security:\n\n• Biometric authentication (fingerprint/facial)\n• Two-factor authentication (2FA)\n• Multi-signature (up to 3 additional signers)\n• Customizable transaction limits\n• Suspicious activity alerts\n• Local data encryption\n• Emergency mode (quick freezing)\n• Address whitelisting\n\nYou can configure all these options in the Settings > Security section.",
  
    "How do I set up automatic payments?":
      "To set up automatic payments in Galaxy Wallet:\n\n1. Go to the 'Automations' section\n2. Select 'New Automation' > 'Payment'\n3. Set the recipient, amount, and frequency (daily, weekly, or monthly)\n4. Optionally, add a memo or note to identify the payment\n5. Configure additional conditions if desired (e.g., only execute if balance exceeds a certain amount)\n6. Review and confirm the configuration\n\nAutomatic payments will execute according to the schedule you set, even if you don't have the application open.",
  
    "How do I recover my seed phrase?":
      "The seed phrase (or recovery phrase) is the master key to your wallet and cannot be recovered if you lose it. For security reasons, Galaxy Wallet does not store your seed phrase on any server.\n\nIf you still have access to your wallet, you can view your seed phrase by following these steps:\n\n1. Go to Settings > Security\n2. Select 'View seed phrase'\n3. Verify your identity (password/biometrics)\n4. Write down your phrase in a secure place, preferably offline\n\nRemember: NEVER share your seed phrase with anyone, not even Galaxy Wallet support.",
  };
  

export function AIChatbot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm the Galaxy Wallet assistant. How can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus(); 
    }, 100)
  }, [])

  const handleSend = async () => {
    if (input.trim() === "") return


    const userMessage = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)


    setTimeout(() => {
      let response


      const matchedQuestion = Object.keys(sampleResponses).find((q) =>
        input.toLowerCase().includes(q.toLowerCase().substring(0, 10)),
      )

      if (matchedQuestion) {
        response = sampleResponses[matchedQuestion];
      } else {

        response =
          "I understand your query. For more detailed information on this topic, I would recommend checking our documentation or opening a support ticket so our team can assist you personally."
      }

      setMessages((prev) => [...prev, { role: "assistant", content: response }])
      setIsTyping(false)
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleQuickQuestion = (question: string) => {
    setInput(question)
    setTimeout(() => {
      handleSend()
    }, 100)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 right-0 z-50 w-full md:w-96 h-[600px] md:h-[500px] md:mr-6 md:mb-6 rounded-t-lg md:rounded-lg overflow-hidden shadow-2xl flex flex-col"
    >

      <div className="bg-gradient-to-r from-[#3B82F6] to-[#9333EA] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-white">AI Assistant</h3>
            <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-xs">
              Online
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-[#0D0D22] space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user" ? "bg-[#7C3AED] text-white" : "bg-gray-800 text-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {message.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                <span className="text-xs font-medium">{message.role === "assistant" ? "AI Assistant" : "You"}</span>
              </div>
              <div className="whitespace-pre-line text-sm">{message.content}</div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-gray-800 text-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Bot className="h-4 w-4" />
                <span className="text-xs font-medium">AI Assistant</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>


      <div className="bg-gray-900 p-2 overflow-x-auto whitespace-nowrap scrollbar-thin">
        <div className="flex gap-2">
          {predefinedQuestions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300 whitespace-nowrap flex-shrink-0"
              onClick={() => handleQuickQuestion(question)}
            >
              {question}
            </Button>
          ))}
        </div>
      </div>


      <div className="p-4 bg-gray-900 border-t border-gray-800 flex gap-2">
        <Input
          ref={inputRef}
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-gray-800 border-gray-700 focus:border-purple-500 text-white"
        />
        <Button
          className="bg-[#7C3AED] hover:bg-[#6D31D9] text-white"
          onClick={handleSend}
          disabled={isTyping || input.trim() === ""}
        >
          {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </motion.div>
  )
}

