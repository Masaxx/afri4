import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { useToast } from "@/hooks/use-toast";

export default function Verify2FA() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');

  // Get email from session storage (set during login)
  const email = sessionStorage.getItem('2fa_email');

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Session expired. Please log in again.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!code) {
      toast({
        title: "Error",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/auth/login', {
        email,
        password: sessionStorage.getItem('2fa_password'),
        twoFactorCode: code,
      });
      
      const data = await response.json();
      
      // Store token
      localStorage.setItem('auth_token', data.token);
      
      // Clear session storage
      sessionStorage.removeItem('2fa_email');
      sessionStorage.removeItem('2fa_password');
      
      toast({
        title: "Success",
        description: "Login successful!",
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Invalid 2FA code',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyBackupCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !backupCode) {
      toast({
        title: "Error",
        description: "Please enter a backup code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/auth/2fa/verify-backup', {
        email,
        backupCode: backupCode.toUpperCase(),
      });
      
      const data = await response.json();
      
      // Store token
      localStorage.setItem('auth_token', data.token);
      
      // Clear session storage
      sessionStorage.removeItem('2fa_email');
      sessionStorage.removeItem('2fa_password');
      
      toast({
        title: "Success",
        description: "Login successful using backup code!",
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Invalid backup code',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="verify-2fa-page">
      <Navbar />
      
      <div className="py-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center mb-4">
                <Shield className="text-white h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold" data-testid="2fa-title">
                Two-Factor Authentication
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                {showBackupCode 
                  ? 'Enter one of your backup codes'
                  : 'Enter the 6-digit code sent to your email'
                }
              </p>
            </CardHeader>
            
            <CardContent>
              {!showBackupCode ? (
                <form onSubmit={handleVerify2FA} className="space-y-6">
                  <div>
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      id="code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="text-center text-2xl tracking-widest"
                      data-testid="input-2fa-code"
                    />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> The code expires in 10 minutes. Check your email's spam folder if you don't see it.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isLoading || code.length !== 6}
                    data-testid="button-verify-2fa"
                  >
                    {isLoading ? "Verifying..." : "Verify"}
                  </Button>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowBackupCode(true)}
                      className="text-sm text-primary hover:underline w-full text-center"
                      data-testid="use-backup-code"
                    >
                      Use a backup code instead
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sessionStorage.removeItem('2fa_email');
                        sessionStorage.removeItem('2fa_password');
                        navigate('/login');
                      }}
                      className="text-sm text-muted-foreground hover:underline w-full text-center inline-flex items-center justify-center gap-2"
                      data-testid="cancel-2fa"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Cancel and return to login
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyBackupCode} className="space-y-6">
                  <div>
                    <Label htmlFor="backupCode">Backup Code</Label>
                    <Input
                      id="backupCode"
                      type="text"
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                      placeholder="Enter backup code"
                      maxLength={10}
                      className="text-center text-xl tracking-wider"
                      data-testid="input-backup-code"
                    />
                  </div>

                  <div className="bg-muted/50 border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      Backup codes are 8-10 character codes you received when enabling 2FA. 
                      Each code can only be used once.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isLoading || backupCode.length < 8}
                    data-testid="button-verify-backup"
                  >
                    {isLoading ? "Verifying..." : "Verify Backup Code"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setShowBackupCode(false)}
                    className="text-sm text-primary hover:underline w-full text-center"
                    data-testid="use-email-code"
                  >
                    Use email code instead
                  </button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
