import { io, Socket } from 'socket.io-client';

export class WebSocketManager {
  private socket: Socket | null = null;
  private token: string | null = null;
  private isConnecting = false;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      if (this.isConnecting) {
        // Wait for existing connection attempt
        const checkConnection = () => {
          if (this.socket?.connected) {
            resolve(this.socket);
          } else if (!this.isConnecting) {
            reject(new Error('Connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
        return;
      }

      if (!this.token) {
        reject(new Error('No authentication token'));
        return;
      }

      this.isConnecting = true;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}`;

      this.socket = io(wsUrl, {
        path: '/ws',
        auth: {
          token: this.token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        this.isConnecting = false;
        console.log('WebSocket connected');
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        this.isConnecting = false;
        console.error('WebSocket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnecting = false;
        console.log('WebSocket disconnected:', reason);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Chat methods
  joinChat(chatId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_chat', chatId);
    }
  }

  leaveChat(chatId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_chat', chatId);
    }
  }

  sendMessage(chatId: string, content: string) {
    if (this.socket?.connected) {
      this.socket.emit('send_message', { chatId, content });
    }
  }

  onNewMessage(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  onJobUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('job_update', callback);
    }
  }

  onNotification(callback: (notification: any) => void) {
    if (this.socket) {
      this.socket.on('notification', callback);
    }
  }

  // Typing indicators
  setTyping(chatId: string, isTyping: boolean) {
    if (this.socket?.connected) {
      this.socket.emit('typing', { chatId, isTyping });
    }
  }

  onUserTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  // System announcements
  onSystemAnnouncement(callback: (announcement: any) => void) {
    if (this.socket) {
      this.socket.on('system_announcement', callback);
    }
  }

  // Error handling
  onError(callback: (error: any) => void) {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  // Clean up listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Get socket instance for custom operations
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Global instance
export const wsManager = new WebSocketManager();

// Hook-like interface for React components
export function createWebSocketHook() {
  return {
    connect: () => wsManager.connect(),
    disconnect: () => wsManager.disconnect(),
    isConnected: () => wsManager.isConnected(),
    joinChat: (chatId: string) => wsManager.joinChat(chatId),
    leaveChat: (chatId: string) => wsManager.leaveChat(chatId),
    sendMessage: (chatId: string, content: string) => wsManager.sendMessage(chatId, content),
    onNewMessage: (callback: (data: any) => void) => wsManager.onNewMessage(callback),
    onJobUpdate: (callback: (data: any) => void) => wsManager.onJobUpdate(callback),
    onNotification: (callback: (notification: any) => void) => wsManager.onNotification(callback),
    setTyping: (chatId: string, isTyping: boolean) => wsManager.setTyping(chatId, isTyping),
    onUserTyping: (callback: (data: any) => void) => wsManager.onUserTyping(callback),
    onSystemAnnouncement: (callback: (announcement: any) => void) => wsManager.onSystemAnnouncement(callback),
    onError: (callback: (error: any) => void) => wsManager.onError(callback),
  };
}
