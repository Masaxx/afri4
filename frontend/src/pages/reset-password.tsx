import { useState } from "react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      toast({
        title: "Error",
        description: "Invalid or missing reset token",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/auth/reset-password', {
        token,
        newPassword: data.newPassword,
      });
      
      const result = await response.json();
      
      setResetSuccess(true);
      toast({
        title: "Success",
        description: result.message,
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to reset password',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="reset-password-page">
      <Navbar />
      
      <div className="py-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center mb-4">
                {resetSuccess ? (
                  <CheckCircle className="text-white h-8 w-8" />
                ) : (
                  <Lock className="text-white h-8 w-8" />
                )}
              </div>
              <CardTitle className="text-2xl font-bold" data-testid="reset-password-title">
                {resetSuccess ? 'Password Reset!' : 'Set New Password'}
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                {resetSuccess 
                  ? "Your password has been successfully reset"
                  : 'Choose a strong password for your account'
                }
              </p>
            </CardHeader>
            
            <CardContent>
              {!resetSuccess ? (
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        {...form.register("newPassword")}
                        placeholder="Enter new password"
                        data-testid="input-new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        data-testid="toggle-password"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {form.formState.errors.newPassword && (
                      <p className="text-destructive text-sm mt-1" data-testid="error-new-password">
                        {form.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        {...form.register("confirmPassword")}
                        placeholder="Confirm new password"
                        data-testid="input-confirm-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        data-testid="toggle-confirm-password"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {form.formState.errors.confirmPassword && (
                      <p className="text-destructive text-sm mt-1" data-testid="error-confirm-password">
                        {form.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="bg-muted/50 border rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">Password must contain:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• At least 8 characters</li>
                      <li>• One uppercase letter</li>
                      <li>• One lowercase letter</li>
                      <li>• One number</li>
                      <li>• One special character</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isLoading}
                    data-testid="button-reset-password"
                  >
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 text-center">
                    <CheckCircle className="h-12 w-12 text-secondary mx-auto mb-3" />
                    <p className="text-sm text-foreground font-medium">
                      Your password has been successfully reset!
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Redirecting to login page...
                    </p>
                  </div>

                  <Link href="/login">
                    <Button className="w-full" data-testid="goto-login">
                      Go to Login
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
