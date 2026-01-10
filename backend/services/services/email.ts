import { Resend } from 'resend';

interface EmailService {
  sendVerificationEmail(to: string, token: string): Promise<boolean>;
  sendPasswordResetEmail(to: string, token: string): Promise<boolean>;
  send2FACode(to: string, code: string): Promise<boolean>;
}

class ResendEmailService implements EmailService {
  private resend: Resend | null = null;
  private fromEmail: string;
  private baseUrl: string;
  private domain: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.fromEmail = process.env.EMAIL_FROM || 'onboarding@loadxafrica.com';
      this.baseUrl = process.env.FRONTEND_URL || 'https://www.loadxafrica.com';
      this.domain = 'loadxafrica.com';
      
      console.log('✅ Resend email service initialized');
      console.log(`📧 From: ${this.fromEmail}`);
      console.log(`🌐 Base URL: ${this.baseUrl}`);
    } else {
      console.warn('⚠ Resend API key not configured. Email functionality disabled.');
      console.warn('⚠ Set RESEND_API_KEY environment variable to enable emails.');
    }
  }

  private async sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
    if (!this.resend) {
      console.warn('Email service not configured. Skipping email.');
      return false;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: to,
        subject: subject,
        html: html,
        text: text
      });

      if (error) {
        console.error('❌ Resend API error:', error);
        return false;
      }

      if (data?.id) {
        console.log(`✅ Email sent successfully. Resend ID: ${data.id}`);
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('❌ Email sending error:', error.message || error);
      return false;
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    const verificationUrl = `${this.baseUrl}/verify-email?token=${token}`;
    
    const subject = 'Verify Your Email - LoadLink Africa';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - LoadLink Africa</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .content h2 { color: #1f2937; margin-top: 0; font-size: 24px; font-weight: 600; }
          .content p { color: #6b7280; line-height: 1.6; font-size: 16px; margin-bottom: 20px; }
          .button { display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); 
                   color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; 
                   font-weight: 600; font-size: 16px; margin: 20px 0; }
          .link { word-break: break-all; color: #4f46e5; background-color: #f3f4f6; 
                  padding: 12px; border-radius: 6px; font-size: 14px; margin: 20px 0; }
          .footer { padding: 30px; text-align: center; color: #9ca3af; font-size: 14px; 
                    background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
          .footer p { margin: 5px 0; }
          .logo { color: white; font-size: 24px; font-weight: 700; margin-bottom: 10px; }
          .subtitle { color: rgba(255,255,255,0.9); font-size: 16px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">LoadLink Africa</div>
            <h1>Verify Your Email</h1>
            <div class="subtitle">Connecting shipping companies with truckers across Africa</div>
          </div>
          <div class="content">
            <h2>Welcome to LoadLink Africa! 🎉</h2>
            <p>Thank you for registering. Please verify your email address to activate your account and start connecting with logistics partners.</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <div class="link">${verificationUrl}</div>
            
            <p><strong>Important:</strong> This verification link will expire in 24 hours.</p>
            
            <p>If you didn't create an account with LoadLink Africa, you can safely ignore this email. Your email address will not be added to any mailing lists.</p>
            
            <p>Need help? <a href="mailto:support@${this.domain}" style="color: #4f46e5;">Contact our support team</a></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} LoadLink Africa. All rights reserved.</p>
            <p>Connecting Shipping Companies with Truckers Across Africa</p>
            <p><a href="${this.baseUrl}" style="color: #4f46e5;">Visit our website</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `Welcome to LoadLink Africa!

Please verify your email address to activate your account.

Click this link to verify your email:
${verificationUrl}

This link expires in 24 hours.

If you didn't create an account, please ignore this email.

Thank you,
The LoadLink Africa Team`;

    const sent = await this.sendEmail(to, subject, html, text);
    if (sent) {
      console.log(`✅ Verification email sent to: ${to}`);
    } else {
      console.error(`❌ Failed to send verification email to: ${to}`);
    }
    return sent;
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
    const resetUrl = `${this.baseUrl}/reset-password?token=${token}`;
    
    const subject = 'Reset Your Password - LoadLink Africa';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - LoadLink Africa</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .content h2 { color: #1f2937; margin-top: 0; font-size: 24px; font-weight: 600; }
          .content p { color: #6b7280; line-height: 1.6; font-size: 16px; margin-bottom: 20px; }
          .button { display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); 
                   color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; 
                   font-weight: 600; font-size: 16px; margin: 20px 0; }
          .link { word-break: break-all; color: #dc2626; background-color: #fef2f2; 
                  padding: 12px; border-radius: 6px; font-size: 14px; margin: 20px 0; }
          .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; 
                     margin: 20px 0; border-radius: 4px; }
          .footer { padding: 30px; text-align: center; color: #9ca3af; font-size: 14px; 
                    background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
          .footer p { margin: 5px 0; }
          .logo { color: white; font-size: 24px; font-weight: 700; margin-bottom: 10px; }
          .subtitle { color: rgba(255,255,255,0.9); font-size: 16px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">LoadLink Africa</div>
            <h1>Password Reset</h1>
            <div class="subtitle">Secure your account</div>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your LoadLink Africa account password. Click the button below to create a new secure password.</p>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> If you didn't request this password reset, please ignore this email and ensure your account is secure.
            </div>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <div class="link">${resetUrl}</div>
            
            <p><strong>This password reset link expires in 1 hour for security reasons.</strong></p>
            
            <p>For security best practices:</p>
            <ul style="color: #6b7280; line-height: 1.6;">
              <li>Use a strong, unique password</li>
              <li>Enable two-factor authentication</li>
              <li>Never share your password with anyone</li>
            </ul>
            
            <p>Need help? <a href="mailto:support@${this.domain}" style="color: #dc2626;">Contact our security team</a></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} LoadLink Africa. All rights reserved.</p>
            <p>Connecting Shipping Companies with Truckers Across Africa</p>
            <p><a href="${this.baseUrl}" style="color: #4f46e5;">Visit our website</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `LoadLink Africa - Password Reset

We received a request to reset your password.

Click this link to reset your password:
${resetUrl}

This link expires in 1 hour.

If you didn't request a password reset, please ignore this email and ensure your account is secure.

Security Tips:
• Use a strong, unique password
• Enable two-factor authentication
• Never share your password

For help, contact: support@${this.domain}

Thank you,
The LoadLink Africa Security Team`;

    const sent = await this.sendEmail(to, subject, html, text);
    if (sent) {
      console.log(`✅ Password reset email sent to: ${to}`);
    } else {
      console.error(`❌ Failed to send password reset email to: ${to}`);
    }
    return sent;
  }

  async send2FACode(to: string, code: string): Promise<boolean> {
    const subject = 'Your 2FA Code - LoadLink Africa';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>2FA Code - LoadLink Africa</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; text-align: center; }
          .content h2 { color: #1f2937; margin-top: 0; font-size: 24px; font-weight: 600; }
          .content p { color: #6b7280; line-height: 1.6; font-size: 16px; margin-bottom: 20px; }
          .code { font-size: 48px; font-weight: 700; letter-spacing: 10px; color: #059669; 
                  margin: 30px 0; padding: 20px; background-color: #f0fdf4; border-radius: 12px; 
                  display: inline-block; }
          .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; 
                     margin: 30px 0; border-radius: 4px; text-align: left; }
          .footer { padding: 30px; text-align: center; color: #9ca3af; font-size: 14px; 
                    background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
          .footer p { margin: 5px 0; }
          .logo { color: white; font-size: 24px; font-weight: 700; margin-bottom: 10px; }
          .subtitle { color: rgba(255,255,255,0.9); font-size: 16px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">LoadLink Africa</div>
            <h1>Two-Factor Authentication</h1>
            <div class="subtitle">Extra layer of security for your account</div>
          </div>
          <div class="content">
            <h2>Your Verification Code</h2>
            <p>Enter this code in the LoadLink Africa login page to complete your authentication:</p>
            
            <div class="code">${code}</div>
            
            <p><strong>⏰ This code expires in 10 minutes.</strong></p>
            
            <div class="warning">
              <strong>⚠️ Security Alert:</strong> 
              <p>If you didn't request this 2FA code, someone may be trying to access your account. Please:</p>
              <ol>
                <li>Change your password immediately</li>
                <li>Enable 2FA if not already enabled</li>
                <li>Contact our support team</li>
              </ol>
            </div>
            
            <p>For your security, never share this code with anyone. LoadLink Africa support will never ask for your 2FA code.</p>
            
            <p>Need help? <a href="mailto:security@${this.domain}" style="color: #059669;">Contact our security team</a></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} LoadLink Africa. All rights reserved.</p>
            <p>Connecting Shipping Companies with Truckers Across Africa</p>
            <p><a href="${this.baseUrl}" style="color: #4f46e5;">Visit our website</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `LoadLink Africa - Two-Factor Authentication

Your verification code is: ${code}

Enter this code to complete your login.

⏰ This code expires in 10 minutes.

⚠️ SECURITY ALERT:
If you didn't request this 2FA code, someone may be trying to access your account. Please:
1. Change your password immediately
2. Enable 2FA if not already enabled
3. Contact our security team

Never share this code with anyone. LoadLink Africa support will never ask for your 2FA code.

For help, contact: security@${this.domain}

Thank you,
The LoadLink Africa Security Team`;

    const sent = await this.sendEmail(to, subject, html, text);
    if (sent) {
      console.log(`✅ 2FA email sent to: ${to}`);
    } else {
      console.error(`❌ Failed to send 2FA email to: ${to}`);
    }
    return sent;
  }

  // Optional: Test method to verify Resend connection
  async testConnection(): Promise<boolean> {
    if (!this.resend) {
      console.error('❌ Resend not initialized');
      return false;
    }

    try {
      const testEmail = 'test@example.com';
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: testEmail,
        subject: 'Test Email - LoadLink Africa',
        html: '<p>This is a test email to verify Resend integration.</p>',
        text: 'Test email for Resend integration'
      });

      if (error) {
        console.error('❌ Resend test failed:', error);
        return false;
      }

      console.log('✅ Resend connection test successful');
      console.log(`📧 Test email ID: ${data?.id}`);
      return true;
    } catch (error: any) {
      console.error('❌ Resend test error:', error.message || error);
      return false;
    }
  }
}

export const emailService = new ResendEmailService();
