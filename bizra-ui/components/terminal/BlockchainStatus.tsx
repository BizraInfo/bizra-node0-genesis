"use client"

import { useState, useEffect } from 'react'
import { useBlockchainData } from '@/hooks/use-websocket'

export function BlockchainStatus() {
  const { blockchainStats, isConnected, connectionStatus } = useBlockchainData()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="glass-card p-4 bg-[rgba(10,24,40,0.9)] backdrop-blur-20 border border-[rgba(212,175,55,0.3)] rounded-2xl shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
          }`} />
          <span className="text-white text-sm font-600">
            BIZRA NODE0
          </span>
          <span className="text-xs text-[rgba(255,255,255,0.6)] uppercase">
            {connectionStatus}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[rgba(255,255,255,0.7)]">TPS</span>
            <span className="text-[#D4AF37] font-mono text-sm">
              {blockchainStats?.tps || 0}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-[rgba(255,255,255,0.7)]">احسان Score</span>
            <span className="text-[#D4AF37] font-mono text-sm">
              {blockchainStats?.احسانScore ? `${blockchainStats.احسانScore}/100` : '100/100'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-[rgba(255,255,255,0.7)]">Validators</span>
            <span className="text-[#D4AF37] font-mono text-sm">
              {blockchainStats?.activeValidators || 0}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-[rgba(255,255,255,0.7)]">Finality</span>
            <span className="text-[#D4AF37] font-mono text-sm">
              {blockchainStats?.finality || 'pending'}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[rgba(212,175,55,0.2)]">
          <div className="text-center">
            <span className="text-xs text-[rgba(255,255,255,0.5)]">
              Live Blockchain Status
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
