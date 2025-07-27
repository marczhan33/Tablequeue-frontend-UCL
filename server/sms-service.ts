import twilio from 'twilio';
import crypto from 'crypto';

// Initialize Twilio client
let twilioClient: twilio.Twilio | null = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

/**
 * Generate a 6-digit verification code
 * @returns A 6-digit numeric code
 */
export function generateSMSCode(): { code: string; expires: Date } {
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expiration (15 minutes from now)
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 15);
  
  return { code, expires };
}

/**
 * Send SMS verification code
 * @param to Phone number in E.164 format (e.g., +1234567890)
 * @param code Verification code
 * @param username Username for personalization
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function sendPasswordResetSMS(
  to: string,
  code: string,
  username: string
): Promise<boolean> {
  if (!twilioClient) {
    console.warn('Twilio not configured. SMS sending skipped.');
    return false;
  }

  if (!process.env.TWILIO_PHONE_NUMBER) {
    console.warn('Twilio phone number not set. SMS sending skipped.');
    return false;
  }

  try {
    const message = await twilioClient.messages.create({
      body: `Hi ${username}, your TableQueue password reset code is: ${code}. This code expires in 15 minutes. If you didn't request this, please ignore this message.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });

    console.log(`SMS sent successfully: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
}

/**
 * Send SMS via WhatsApp (if configured)
 * @param to Phone number in E.164 format (e.g., +1234567890)
 * @param code Verification code
 * @param username Username for personalization
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function sendPasswordResetWhatsApp(
  to: string,
  code: string,
  username: string
): Promise<boolean> {
  if (!twilioClient) {
    console.warn('Twilio not configured. WhatsApp sending skipped.');
    return false;
  }

  if (!process.env.TWILIO_WHATSAPP_NUMBER) {
    console.warn('Twilio WhatsApp number not set. WhatsApp sending skipped.');
    return false;
  }

  try {
    const message = await twilioClient.messages.create({
      body: `Hi ${username}, your TableQueue password reset code is: ${code}. This code expires in 15 minutes. If you didn't request this, please ignore this message.`,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`
    });

    console.log(`WhatsApp message sent successfully: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return false;
  }
}