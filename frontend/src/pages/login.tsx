import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { login, isLoginLoading } = useAuth();
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      navigate("/dashboard");
    } catch (error) {
      // Error handled by useAuth hook
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="login-page">
      <Navbar />
      
      <div className="py-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-accent to-orange-400 rounded-lg flex items-center justify-center mb-4">
                <Truck className="text-white text-2xl" />
              </div>
              <CardTitle className="text-2xl font-bold" data-testid="login-title">
                Sign In to LoadLink Africa
              </CardTitle>
              <p className="text-muted-foreground">
                Access your freight matching dashboard
              </p>
            </CardHeader>
            
            <CardContent>
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

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...form.register("password")}
                    placeholder="Enter your password"
                    data-testid="input-password"
                  />
                  {form.formState.errors.password && (
                    <p className="text-destructive text-sm mt-1" data-testid="error-password">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isLoginLoading}
                  data-testid="button-sign-in"
                >
                  {isLoginLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-4">
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-primary hover:underline" 
                  data-testid="forgot-password-link"
                >
                  Forgot your password?
                </Link>
                
                <div className="border-t pt-4">
                  <p className="text-muted-foreground text-sm">
                    Don't have an account?{" "}
                    <Link 
                      href="/register" 
                      className="text-primary hover:underline font-medium" 
                      data-testid="register-link"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
