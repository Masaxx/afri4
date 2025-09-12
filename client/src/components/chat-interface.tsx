import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  senderId: number;
  content: string;
  timestamp: string;
  read: boolean;
}

interface Chat {
  id: number;
  jobId: number;
  participants: number[];
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface ChatInterfaceProps {
  chatId: number;
}

export function ChatInterface({ chatId }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sendMessage, joinChat, leaveChat, onNewMessage, isConnected } = useWebSocket();
  
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat data
  const { data: chatData, isLoading } = useQuery({
    queryKey: ['/api/chats', chatId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/chats/${chatId}`);
      return response.json();
    },
    enabled: !!chatId
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', `/api/chats/${chatId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId] });
    }
  });

  const chat: Chat = chatData?.chat;

  // Join chat room on mount
  useEffect(() => {
    if (chatId && isConnected) {
      joinChat(chatId);
      return () => {
        leaveChat(chatId);
      };
    }
  }, [chatId, isConnected, joinChat, leaveChat]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (data.chatId === chatId) {
        queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId] });
        // Mark as read if user is viewing this chat
        if (data.message.senderId !== user?._id) {
          setTimeout(() => markAsReadMutation.mutate(), 500);
        }
      }
    };

    onNewMessage(handleNewMessage);
  }, [chatId, onNewMessage, queryClient, user?._id, markAsReadMutation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !isConnected) return;

    sendMessage(chatId, messageText.trim());
    setMessageText("");
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getOtherParticipantName = () => {
    if (!chat || !user) return "Unknown";
    const otherParticipant = chat.participants.find(p => p !== user._id);
    return otherParticipant ? "Chat Partner" : "Unknown";
  };

  const getUserInitials = (userId: string) => {
    if (userId === user?._id) {
      return user.contactPersonName?.substring(0, 2).toUpperCase() || "ME";
    }
    return "CP"; // Chat Partner
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <CardContent className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </CardContent>
    );
  }

  if (!chat) {
    return (
      <CardContent className="h-full flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chat Not Found</h3>
          <p className="text-muted-foreground">This conversation could not be loaded.</p>
        </div>
      </CardContent>
    );
  }

  return (
    <>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm">{getOtherParticipantName()}</CardTitle>
              <p className="text-xs text-muted-foreground">
                Job Chat • {chat.participants.length} participants
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px] p-4" data-testid="chat-messages">
          <div className="space-y-4">
            {chat.messages && chat.messages.length > 0 ? (
              chat.messages.map((message, index) => {
                const isOwn = message.senderId === user?._id;
                
                return (
                  <div
                    key={index}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${index}`}
                  >
                    <div className="flex items-start space-x-2 max-w-xs lg:max-w-md">
                      {!isOwn && (
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getUserInitials(message.senderId)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`rounded-lg px-4 py-2 ${
                        isOwn 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          isOwn 
                            ? 'text-primary-foreground/70' 
                            : 'text-muted-foreground'
                        }`}>
                          {formatMessageTime(message.timestamp)}
                        </p>
                      </div>
                      
                      {isOwn && (
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getUserInitials(message.senderId)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  No messages yet. Start the conversation!
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t">
          {!isConnected && (
            <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded text-center">
              <span className="text-amber-700 text-sm">
                Disconnected - Messages may not send
              </span>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={!isConnected}
              data-testid="message-input"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!messageText.trim() || !isConnected}
              data-testid="send-message-button"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </>
  );
}
