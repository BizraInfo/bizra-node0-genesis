"use client"

import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export function BlockchainStatus() {
  const [status, setStatus] = useState<"loading" | "connected" | "disconnected">("loading")

  useEffect(() => {
    fetch("/api/blockchain/health")
      .then((res) => {
        if (res.ok) {
          setStatus("connected")
        } else {
          setStatus("disconnected")
        }
      })
      .catch(() => {
        setStatus("disconnected")
      })
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(10,24,40,0.9)] backdrop-blur-[10px] border border-[rgba(212,175,55,0.2)]">
      {status === "loading" && <Loader2 className="h-4 w-4 text-[#D4AF37] animate-spin" />}
      {status === "connected" && <CheckCircle className="h-4 w-4 text-green-400" />}
      {status === "disconnected" && <XCircle className="h-4 w-4 text-red-400" />}
      <span className="text-sm text-[rgba(255,255,255,0.7)]">
        Blockchain API: {status === "connected" ? "Connected" : status === "disconnected" ? "Disconnected" : "Connecting..."}
      </span>
    </div>
  )
}

