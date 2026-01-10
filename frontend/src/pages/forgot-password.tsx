import { useState } from "react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/auth/forgot-password', data);
      const result = await response.json();
      
      setEmailSent(true);
      toast({
        title: "Success",
        description: result.message,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to send reset email',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="forgot-password-page">
      <Navbar />
      
      <div className="py-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center mb-4">
                {emailSent ? (
                  <CheckCircle className="text-white h-8 w-8" />
                ) : (
                  <Mail className="text-white h-8 w-8" />
                )}
              </div>
              <CardTitle className="text-2xl font-bold" data-testid="forgot-password-title">
                {emailSent ? 'Check Your Email' : 'Forgot Password?'}
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                {emailSent 
                  ? "We've sent password reset instructions to your email"
                  : 'Enter your email and we\'ll send you reset instructions'
                }
              </p>
            </CardHeader>
            
            <CardContent>
              {!emailSent ? (
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="Enter your email"
                      data-testid="input-email"
                    />
                    {form.formState.errors.email && (
                      <p className="text-destructive text-sm mt-1" data-testid="error-email">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isLoading}
                    data-testid="button-send-reset"
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>

                  <div className="text-center">
                    <Link 
                      href="/login" 
                      className="text-sm text-primary hover:underline inline-flex items-center gap-2" 
                      data-testid="back-to-login"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Login
                    </Link>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
                    <p className="text-sm text-foreground">
                      If an account exists with <strong>{form.getValues('email')}</strong>, 
                      you will receive a password reset link shortly.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Didn't receive an email? Check your spam folder or try again.
                    </p>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setEmailSent(false)}
                      data-testid="try-again"
                    >
                      Try Another Email
                    </Button>

                    <Link href="/login">
                      <Button variant="ghost" className="w-full" data-testid="return-to-login">
                        Return to Login
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {!emailSent && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
