import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

export function useWebSocket() {
  const { user } = useAuth();
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    if (!user) {
      console.log('No user, skipping WebSocket connection');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log('No auth token, skipping WebSocket connection');
      return;
    }

    // Use environment variable or fallback to window location
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
    console.log('Connecting to WebSocket at:', apiUrl);

    socketRef.current = io(apiUrl, {
      path: '/ws',
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      setReconnectAttempts(0);
      console.log('✅ Connected to WebSocket');
    });

    socketRef.current.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('❌ Disconnected from WebSocket:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        socketRef.current?.connect();
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setReconnectAttempts(prev => prev + 1);
      
      if (reconnectAttempts < 3) {
        // Only show error toast after multiple failed attempts
        return;
      }
      
      toast({
        title: "Connection Issue",
        description: "Real-time features may be limited. Messages will still be delivered.",
        variant: "default",
      });
    });

    socketRef.current.on('notification', (notification) => {
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      });
    });

    socketRef.current.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (socketRef.current) {
        console.log('Cleaning up WebSocket connection');
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [user, toast]);

  const sendMessage = useCallback((chatId: string, content: string) => {
    if (!socketRef.current || !isConnected) {
      console.warn('Cannot send message: WebSocket not connected');
      throw new Error('WebSocket not connected');
    }
    
    console.log('Sending message via WebSocket:', { chatId, content });
    socketRef.current.emit('send_message', { chatId, content });
  }, [isConnected]);

  const joinChat = useCallback((chatId: string) => {
    if (socketRef.current && isConnected) {
      console.log('Joining chat room:', chatId);
      socketRef.current.emit('join_chat', chatId);
    }
  }, [isConnected]);

  const leaveChat = useCallback((chatId: string) => {
    if (socketRef.current && isConnected) {
      console.log('Leaving chat room:', chatId);
      socketRef.current.emit('leave_chat', chatId);
    }
  }, [isConnected]);

  const onNewMessage = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off('new_message'); // Remove previous listeners
      socketRef.current.on('new_message', callback);
    }
  }, []);

  const onJobUpdate = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off('job_update'); // Remove previous listeners
      socketRef.current.on('job_update', callback);
    }
  }, []);

  return {
    isConnected,
    sendMessage,
    joinChat,
    leaveChat,
    onNewMessage,
    onJobUpdate,
    socket: socketRef.current
  };
}
