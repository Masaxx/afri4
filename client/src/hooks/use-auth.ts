import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  email: string;
  role: string;
  companyName?: string;
  contactPersonName: string;
  subscriptionStatus: string;
  emailVerified: boolean;
}

interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export function useAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock user for testing admin dashboard
  const mockUser = {
    id: 1,
    email: "admin@loadlink.co.bw",
    role: "super_admin",
    companyName: "LoadLink Africa Admin",
    contactPersonName: "Admin User",
    subscriptionStatus: "active",
    emailVerified: true
  };

  // Use mock data for now as requested
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    select: (data: any) => data?.user || mockUser, // Fallback to mock user
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => Promise.resolve({ user: mockUser }), // Return mock data
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return response.json();
    },
    onSuccess: (data: AuthResponse) => {
      localStorage.setItem('auth_token', data.token);
      queryClient.setQueryData(['/api/auth/me'], { user: data.user });
      toast({
        title: "Success",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { type: 'trucking' | 'shipping'; userData: any }) => {
      const endpoint = data.type === 'trucking' 
        ? '/api/auth/register/trucking' 
        : '/api/auth/register/shipping';
      const response = await apiRequest('POST', endpoint, data.userData);
      return response.json();
    },
    onSuccess: (data: AuthResponse) => {
      localStorage.setItem('auth_token', data.token);
      queryClient.setQueryData(['/api/auth/me'], { user: data.user });
      toast({
        title: "Success",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logout = () => {
    localStorage.removeItem('auth_token');
    queryClient.clear();
    window.location.href = '/';
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
  };
}
