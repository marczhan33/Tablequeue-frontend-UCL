import { sendSMSNotification } from "../sms-service.js";
import { sendEmailNotification } from "../email-service.js";

export interface NotificationRequest {
  to: string;
  message: string;
  type?: "sms" | "email" | "both";
  subject?: string; // For email notifications
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendCustomerNotification(request: NotificationRequest): Promise<boolean> {
  const { to, message, type = "sms", subject } = request;

  try {
    switch (type) {
      case "sms":
        return await sendSMSNotification(to, message);
      
      case "email":
        if (!subject) {
          throw new Error("Subject is required for email notifications");
        }
        return await sendEmailNotification({
          to,
          subject,
          text: message,
          from: process.env.FROM_EMAIL || "noreply@tablequeue.com"
        });
      
      case "both":
        const [smsResult, emailResult] = await Promise.allSettled([
          sendSMSNotification(to, message),
          sendEmailNotification({
            to,
            subject: subject || "TableQueue Notification",
            text: message,
            from: process.env.FROM_EMAIL || "noreply@tablequeue.com"
          })
        ]);
        
        // Return true if at least one notification was sent successfully
        return (smsResult.status === "fulfilled" && smsResult.value) || 
               (emailResult.status === "fulfilled" && emailResult.value);
      
      default:
        throw new Error(`Unsupported notification type: ${type}`);
    }
  } catch (error) {
    console.error("Notification error:", error);
    return false;
  }
}

export function generateTableReadyMessage(restaurantName: string, customerName: string, partySize: number): string {
  return `Hi ${customerName}! Your table for ${partySize} at ${restaurantName} is ready. Please arrive within the next 10 minutes to claim your table.`;
}

export function generateWaitTimeUpdateMessage(restaurantName: string, customerName: string, newWaitTime: number): string {
  return `Hi ${customerName}! Update from ${restaurantName}: Your estimated wait time is now ${newWaitTime} minutes. We'll notify you when your table is ready.`;
}

export function generateCancellationMessage(restaurantName: string, customerName: string): string {
  return `Hi ${customerName}! Your reservation at ${restaurantName} has been cancelled. We apologize for any inconvenience.`;
}