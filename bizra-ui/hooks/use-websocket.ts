"use client"

import { useEffect, useRef, useState, useCallback } from 'react'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

interface UseWebSocketReturn {
  isConnected: boolean
  lastMessage: WebSocketMessage | null
  sendMessage: (message: any) => void
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  reconnect: () => void
}

export function useWebSocket(url?: string): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000

  const websocketUrl = url || process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080/ws/live-updates'

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setConnectionStatus('connecting')

    try {
      const ws = new WebSocket(websocketUrl)

      ws.onopen = () => {
        console.log('🟢 BIZRA WebSocket connected')
        setIsConnected(true)
        setConnectionStatus('connected')
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)

          // Handle different message types
          switch (message.type) {
            case 'احسان_score_update':
              console.log('📊 احسان score update:', message.data)
              break
            case 'consensus_update':
              console.log('⚡ Consensus update:', message.data)
              break
            case 'block_finalized':
              console.log('✅ Block finalized:', message.data)
              break
            case 'validator_update':
              console.log('👥 Validator update:', message.data)
              break
            default:
              console.log('📨 WebSocket message:', message)
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onclose = (event) => {
        console.log('🔴 BIZRA WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        setConnectionStatus('disconnected')
        wsRef.current = null

        // Auto-reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          console.log(`🔄 Reconnecting in ${reconnectDelay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`)

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectDelay)
        }
      }

      ws.onerror = (error) => {
        console.error('🟠 BIZRA WebSocket error:', error)
        setConnectionStatus('error')
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionStatus('error')
    }
  }, [websocketUrl])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect')
      wsRef.current = null
    }

    setIsConnected(false)
    setConnectionStatus('disconnected')
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, cannot send message')
    }
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    setTimeout(() => connect(), 100)
  }, [connect, disconnect])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Handle page visibility changes for reconnection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected) {
        reconnect()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isConnected, reconnect])

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connectionStatus,
    reconnect,
  }
}

// Specialized hook for blockchain data
export function useBlockchainData() {
  const { isConnected, lastMessage, connectionStatus } = useWebSocket()

  const [blockchainStats, setBlockchainStats] = useState({
    tps: 0,
    finality: 'pending',
    blockHeight: 0,
    activeValidators: 0,
    احسانScore: 100.0,
  })

  const [consensusUpdates, setConsensusUpdates] = useState<any[]>([])
  const [validatorUpdates, setValidatorUpdates] = useState<any[]>([])

  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'احسان_score_update':
          setBlockchainStats(prev => ({
            ...prev,
            احسانScore: lastMessage.data.احسانScore || prev.احسانScore
          }))
          break
        case 'consensus_update':
          setConsensusUpdates(prev => [lastMessage.data, ...prev.slice(0, 9)]) // Keep last 10
          setBlockchainStats(prev => ({
            ...prev,
            tps: lastMessage.data.tps || prev.tps,
            blockHeight: lastMessage.data.blockHeight || prev.blockHeight,
            finality: lastMessage.data.finality || prev.finality,
          }))
          break
        case 'validator_update':
          setValidatorUpdates(prev => [lastMessage.data, ...prev.slice(0, 9)]) // Keep last 10
          setBlockchainStats(prev => ({
            ...prev,
            activeValidators: lastMessage.data.activeValidators || prev.activeValidators,
          }))
          break
      }
    }
  }, [lastMessage])

  return {
    blockchainStats,
    consensusUpdates,
    validatorUpdates,
    isConnected,
    connectionStatus,
  }
}
