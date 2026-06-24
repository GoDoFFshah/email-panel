import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseWebSocketOptions {
  url: string
  onMessage?: (data: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: any) => void
  autoConnect?: boolean
}

export const useWebSocket = ({
  url,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  autoConnect = true,
}: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  const connect = () => {
    if (socketRef.current?.connected) return

    setIsConnecting(true)
    const socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      setIsConnected(true)
      setIsConnecting(false)
      onConnect?.()
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
      onDisconnect?.()
    })

    socket.on('message', (data) => {
      onMessage?.(data)
    })

    socket.on('error', (error) => {
      onError?.(error)
    })

    socketRef.current = socket
  }

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }

  const send = (event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect])

  return {
    connect,
    disconnect,
    send,
    isConnected,
    isConnecting,
    socket: socketRef.current,
  }
}