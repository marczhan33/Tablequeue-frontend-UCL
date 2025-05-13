import { MailService } from '@sendgrid/mail';
import crypto from 'crypto';

// Configure mail service
const mailService = new MailService();

// Set API key if available
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// Email parameters interface
interface EmailParams {
  to: string;
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

Thank you for signing up. To complete your registration, please verify your email address by visiting the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

Best regards,
The TableQueue Team`
  };

  try {
    await mailService.send({
      to: params.to,
      from: {
        email: process.env.EMAIL_FROM || 'noreply@tablequeue.com',
        name: 'TableQueue'
      },
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

/**
 * Send testing email to verify SendGrid configuration
 * @param to Recipient email
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function sendTestEmail(to: string): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not set. Test email skipped.');
    return false;
  }
  
  try {
    await mailService.send({
      to,
      from: {
        email: process.env.EMAIL_FROM || 'noreply@tablequeue.com',
        name: 'TableQueue'
      },
      subject: 'TableQueue Email Service Test',
      text: 'This is a test email to verify that SendGrid integration is working correctly.',
      html: '<h1>TableQueue Email Test</h1><p>This is a test email to verify that SendGrid integration is working correctly.</p>',
    });
    return true;
  } catch (error) {
    console.error('SendGrid test email error:', error);
    return false;
  }
}