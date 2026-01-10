import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'already-verified'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        const response = await apiRequest('GET', `/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (data.alreadyVerified) {
          setStatus('already-verified');
          setMessage('Your email has already been verified');
        } else {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Email verification failed');
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="min-h-screen bg-background" data-testid="verify-email-page">
      <Navbar />
      
      <div className="py-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4">
                {status === 'verifying' && (
                  <div className="bg-primary/10 w-full h-full rounded-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                )}
                {status === 'success' && (
                  <div className="bg-secondary/10 w-full h-full rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-secondary" />
                  </div>
                )}
                {status === 'already-verified' && (
                  <div className="bg-accent/10 w-full h-full rounded-full flex items-center justify-center">
                    <Mail className="h-8 w-8 text-accent" />
                  </div>
                )}
                {status === 'error' && (
                  <div className="bg-destructive/10 w-full h-full rounded-full flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-destructive" />
                  </div>
                )}
              </div>
              <CardTitle className="text-2xl font-bold" data-testid="verify-title">
                {status === 'verifying' && 'Verifying Your Email'}
                {status === 'success' && 'Email Verified!'}
                {status === 'already-verified' && 'Already Verified'}
                {status === 'error' && 'Verification Failed'}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6" data-testid="verify-message">
                {status === 'verifying' && 'Please wait while we verify your email address...'}
                {status === 'success' && message}
                {status === 'already-verified' && message}
                {status === 'error' && message}
              </p>

              {(status === 'success' || status === 'already-verified') && (
                <div className="space-y-3">
                  <Link href="/login">
                    <Button className="w-full" data-testid="goto-login">
                      Continue to Login
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full" data-testid="goto-dashboard">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              )}

              {status === 'error' && (
                <div className="space-y-3">
                  <Link href="/login">
                    <Button className="w-full" data-testid="back-to-login">
                      Back to Login
                    </Button>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    Need a new verification link?{" "}
                    <Link href="/resend-verification" className="text-primary hover:underline">
                      Resend verification email
                    </Link>
                  </p>
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
