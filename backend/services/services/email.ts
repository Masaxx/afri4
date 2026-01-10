import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailService {
  sendVerificationEmail(to: string, token: string): Promise<boolean>;
  sendPasswordResetEmail(to: string, token: string): Promise<boolean>;
  send2FACode(to: string, code: string): Promise<boolean>;
}

class ZohoEmailService implements EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;
  private baseUrl: string;

  constructor() {
    const emailEnabled = process.env.EMAIL_ENABLED === 'true';
    
    if (emailEnabled && process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const config: EmailConfig = {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      };

      this.transporter = nodemailer.createTransport(config);
      this.fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      this.baseUrl = process.env.FRONTEND_URL || 'https://www.loadxafrica.com';
      
      // Verify connection
      this.verifyConnection();
    } else {
      console.warn('⚠ Email credentials not configured. Email functionality disabled.');
    }
  }

  private async verifyConnection(): Promise<void> {
    if (!this.transporter) return;

    try {
      await this.transporter.verify();
      console.log('✅ Email service connected successfully');
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      this.transporter = null;
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email service not configured. Skipping verification email.');
      return false;
    }

    const verificationUrl = `${this.baseUrl}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: `LoadLink Africa <${this.fromEmail}>`,
      to: to,
      subject: 'Verify Your Email - LoadLink Africa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">LoadLink Africa</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2>Welcome to LoadLink Africa! 🎉</h2>
            <p>Thank you for registering. Please verify your email address to activate your account.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold; 
                        display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background-color: #f0f0f0;">
            <p>LoadLink Africa - Connecting Shipping Companies with Truckers Across Africa</p>
            <p>© ${new Date().getFullYear()} LoadLink Africa. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Welcome to LoadLink Africa! Please verify your email by clicking this link: ${verificationUrl}`
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to: ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email service not configured. Skipping password reset email.');
      return false;
    }

    const resetUrl = `${this.baseUrl}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: `LoadLink Africa <${this.fromEmail}>`,
      to: to,
      subject: 'Reset Your Password - LoadLink Africa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Password Reset</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password. Click the button below to create a new password.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold; 
                        display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p><strong>This link expires in 1 hour.</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background-color: #f0f0f0;">
            <p>LoadLink Africa - Connecting Shipping Companies with Truckers Across Africa</p>
            <p>© ${new Date().getFullYear()} LoadLink Africa. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Reset your LoadLink Africa password by clicking this link: ${resetUrl} (expires in 1 hour)`
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to: ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return false;
    }
  }

  async send2FACode(to: string, code: string): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email service not configured. Skipping 2FA email.');
      return false;
    }

    const mailOptions = {
      from: `LoadLink Africa <${this.fromEmail}>`,
      to: to,
      subject: 'Your 2FA Code - LoadLink Africa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Two-Factor Authentication</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9; text-align: center;">
            <h2>Your 2FA Code</h2>
            <p>Enter this code to complete your login:</p>
            <div style="font-size: 48px; font-weight: bold; letter-spacing: 10px; color: #667eea; margin: 30px 0;">
              ${code}
            </div>
            <p><strong>This code expires in 10 minutes.</strong></p>
            <p>If you didn't request this code, please secure your account immediately.</p>
          </div>
          <div style="padding: 20px; text-align: center; color: #999; font-size: 12px; background-color: #f0f0f0;">
            <p>LoadLink Africa - Connecting Shipping Companies with Truckers Across Africa</p>
            <p>© ${new Date().getFullYear()} LoadLink Africa. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Your LoadLink Africa 2FA code is: ${code} (expires in 10 minutes)`
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ 2FA email sent to: ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send 2FA email:', error);
      return false;
    }
  }
}

export const emailService = new ZohoEmailService();
