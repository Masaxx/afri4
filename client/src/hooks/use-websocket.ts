import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

export function useWebSocket() {
  const { user } = useAuth();
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}`;

    socketRef.current = io(wsUrl, {
      path: '/ws',
      auth: {
        token: token
      }
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket');
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
      toast({
        title: "Connection Error",
        description: "Failed to connect to real-time services",
        variant: "destructive",
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [user, toast]);

  const sendMessage = (chatId: string, content: string) => {
    if (socketRef.current) {
      socketRef.current.emit('send_message', { chatId, content });
    }
  };

  const joinChat = (chatId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join_chat', chatId);
    }
  };

  const leaveChat = (chatId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_chat', chatId);
    }
  };

  const onNewMessage = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('new_message', callback);
    }
  };

  const onJobUpdate = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('job_update', callback);
    }
  };

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
