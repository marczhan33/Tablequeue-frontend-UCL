import { config } from "dotenv";
config();

interface NotificationParams {
  to: string;
  message: string;
}

/**
 * Send a WhatsApp notification using Twilio
 * @param to Recipient phone number (must be in E.164 format)
 * @param message Message content
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function sendWhatsAppNotification(
  to: string,
  message: string
): Promise<boolean> {
  // Check if we have the required Twilio environment variables
  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_WHATSAPP_NUMBER
  ) {
    console.error("Missing Twilio WhatsApp configuration");
    return false;
  }

  try {
    // We're checking if credentials exist here, but we'll only attempt to require
    // the Twilio package if we're actually going to use it
    const twilio = require("twilio")(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const response = await twilio.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`
    });

    console.log(`WhatsApp notification sent: ${response.sid}`);
    return true;
  } catch (error) {
    console.error("Error sending WhatsApp notification:", error);
    return false;
  }
}

/**
 * Send an SMS notification using Twilio as a fallback
 * @param to Recipient phone number (must be in E.164 format)
 * @param message Message content
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function sendSmsNotification(
  to: string,
  message: string
): Promise<boolean> {
  // Check if we have the required Twilio environment variables
  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_PHONE_NUMBER
  ) {
    console.error("Missing Twilio SMS configuration");
    return false;
  }

  try {
    const twilio = require("twilio")(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const response = await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });

    console.log(`SMS notification sent: ${response.sid}`);
    return true;
  } catch (error) {
    console.error("Error sending SMS notification:", error);
    return false;
  }
}

/**
 * Send a notification to a customer
 * Tries WhatsApp first, then falls back to SMS if WhatsApp fails
 * @param params Notification parameters
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function sendCustomerNotification(
  params: NotificationParams
): Promise<boolean> {
  // First try WhatsApp
  const whatsappSuccess = await sendWhatsAppNotification(
    params.to,
    params.message
  );
  
  // If WhatsApp fails, try SMS as a fallback
  if (!whatsappSuccess) {
    return await sendSmsNotification(params.to, params.message);
  }
  
  return whatsappSuccess;
}

/**
 * Generate a table ready notification message
 * @param restaurantName The name of the restaurant
 * @param customerName The name of the customer
 * @param partySize The size of the party
 * @returns A formatted message
 */
export function generateTableReadyMessage(
  restaurantName: string,
  customerName: string,
  partySize: number
): string {
  return `Hello ${customerName}, your table for ${partySize} at ${restaurantName} is now ready! Please check in with the host/hostess when you arrive.`;
}