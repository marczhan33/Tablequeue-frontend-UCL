import { MailService } from '@sendgrid/mail';
import crypto from 'crypto';

// Configure mail service
const mailService = new MailService();

// Set API key if available
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// Email parameters interface
export interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Generate a verification token
 * @returns An object containing the token and expiration date
 */
export function generateVerificationToken(): { token: string; expires: Date } {
  // Generate random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Set expiration (24 hours from now)
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);
  
  return { token, expires };
}

/**
 * Generate a password reset token
 * @returns An object containing the token and expiration date
 */
export function generatePasswordResetToken(): { token: string; expires: Date } {
  // Generate random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Set expiration (1 hour from now)
  const expires = new Date();
  expires.setHours(expires.getHours() + 1);
  
  return { token, expires };
}

/**
 * Send verification email
 * @param to Recipient email
 * @param token Verification token
 * @param username Username for personalization
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function sendVerificationEmail(
  to: string,
  token: string,
  username: string
): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not set. Email verification skipped.');
    return false;
  }
  
  // Construct verification URL with base URL from environment or fallback
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const verificationUrl = `${baseUrl}/api/verify-email?token=${token}`;
  
  // Prepare email content
  const params: EmailParams = {
    to,
    from: 'noreply@tablequeue.com',
    subject: 'Verify your TableQueue account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Welcome to TableQueue!</h2>
        <p>Hi ${username},</p>
        <p>Thank you for signing up. To complete your registration, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Verify Email</a>
        </div>
        <p>Alternatively, you can copy and paste the following URL into your browser:</p>
        <p style="word-break: break-all; color: #4f46e5;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p>Best regards,<br>The TableQueue Team</p>
      </div>
    `,
    text: `Welcome to TableQueue!

Hi ${username},

Thank you for signing up. To complete your registration, please verify your email address by clicking the following link:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

Best regards,
The TableQueue Team`
  };

  try {
    await mailService.send({
      to: params.to,
      from: 'noreply@tablequeue.com', // You'll need to configure this domain
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    
    console.log(`Verification email sent to: ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

/**
 * Send password reset email
 * @param to Recipient email
 * @param token Reset token
 * @param username Username for personalization
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function sendPasswordResetEmail(
  to: string,
  token: string,
  username: string
): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not set. Password reset email skipped.');
    return false;
  }
  
  // Construct reset URL with base URL from environment or fallback
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  
  // Prepare email content
  const params: EmailParams = {
    to,
    from: 'noreply@tablequeue.com',
    subject: 'Reset your TableQueue password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Password Reset Request</h2>
        <p>Hi ${username},</p>
        <p>We received a request to reset your password for your TableQueue account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset Password</a>
        </div>
        <p>Alternatively, you can copy and paste the following URL into your browser:</p>
        <p style="word-break: break-all; color: #4f46e5;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        <p>Best regards,<br>The TableQueue Team</p>
      </div>
    `,
    text: `Password Reset Request

Hi ${username},

We received a request to reset your password for your TableQueue account. To set a new password, visit the following link:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
The TableQueue Team`
  };

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    
    console.log(`Password reset email sent to: ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

/**
 * Send general email notification
 * @param params Email parameters
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function sendEmailNotification(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not set. Email notification skipped.');
    return false;
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    
    console.log(`Email notification sent to: ${params.to}`);
    return true;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return false;
  }

  try {
    await mailService.send({
      to: params.to,
      from: 'noreply@tablequeue.com', // You'll need to configure this domain
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    
    console.log(`Password reset email sent to: ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}