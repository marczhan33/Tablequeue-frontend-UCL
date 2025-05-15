import QRCode from 'qrcode';
import { randomBytes } from 'crypto';

/**
 * Generate a unique ID for QR codes
 * @returns A unique string ID
 */
export function generateUniqueQrCodeId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Create a restaurant waitlist QR code
 * @param baseUrl Base URL of the application
 * @param qrCodeId Unique ID for the QR code
 * @returns Data URL of the QR code image
 */
export async function generateRestaurantQrCode(baseUrl: string, qrCodeId: string): Promise<string> {
  // Create the URL that the QR code will point to
  const qrCodeUrl = `${baseUrl}/join-waitlist/${qrCodeId}`;
  
  // Generate QR code as a data URL
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000', // Black dots
        light: '#FFFFFF' // White background
      }
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Create a confirmation QR code for remote guests
 * @param baseUrl Base URL of the application
 * @param confirmationCode Unique confirmation code
 * @param restaurantId Restaurant ID
 * @returns Data URL of the QR code image
 */
export async function generateConfirmationQrCode(baseUrl: string, confirmationCode: string, restaurantId: number): Promise<string> {
  // Create the URL that the QR code will point to
  const qrCodeUrl = `${baseUrl}/confirm-arrival/${restaurantId}/${confirmationCode}`;
  
  // Generate QR code as a data URL
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000', // Black dots
        light: '#FFFFFF' // White background
      }
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error("Error generating confirmation QR code:", error);
    throw new Error("Failed to generate confirmation QR code");
  }
}

/**
 * Generate a random confirmation code
 * @returns A 6-character alphanumeric code
 */
export function generateConfirmationCode(): string {
  // Generate a 6-character alphanumeric code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, 1, I
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  
  return code;
}