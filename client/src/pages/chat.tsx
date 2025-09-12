import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatInterface } from "@/components/chat-interface";
import Navbar from "@/components/ui/navbar";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Chat() {
  const { jobId } = useParams();
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Fetch user's chats
  const { data: chatsData, isLoading: chatsLoading } = useQuery({
    queryKey: ['/api/chats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/chats');
      return response.json();
    }
  });

  // Fetch specific chat if jobId is provided
  const { data: jobChatData } = useQuery({
    queryKey: ['/api/chats/job', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const response = await apiRequest('GET', `/api/chats/job/${jobId}`);
      return response.json();
    },
    enabled: !!jobId
  });

  useEffect(() => {
    if (jobChatData?.chat && !selectedChatId) {
      setSelectedChatId(jobChatData.chat._id);
    }
  }, [jobChatData, selectedChatId]);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Please log in to access chat.</div>;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="chat-page">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" data-testid="back-to-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="chat-title">Messages</h1>
              <p className="text-muted-foreground">Communicate with your business partners</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
          {/* Chat List */}
          <Card className="lg:col-span-1" data-testid="chat-list">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[500px] overflow-y-auto">
                {chatsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : chatsData?.chats?.length > 0 ? (
                  <div className="space-y-2 p-4">
                    {chatsData.chats.map((chat: any) => (
                      <div
                        key={chat._id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedChatId === chat._id 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'hover:bg-muted/50 border border-transparent'
                        }`}
                        onClick={() => setSelectedChatId(chat._id)}
                        data-testid={`chat-item-${chat._id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm truncate">
                            Job Chat
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {chat.participants?.length || 0} participants
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {chat.messages?.length > 0 
                            ? chat.messages[chat.messages.length - 1].content
                            : 'No messages yet'
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm">
                      No conversations yet. Start by applying to jobs or posting new ones.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card className="lg:col-span-3" data-testid="chat-interface">
            {selectedChatId ? (
              <ChatInterface chatId={selectedChatId} />
            ) : (
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to start messaging.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
