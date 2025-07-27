import { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { generatePasswordResetToken, sendPasswordResetEmail } from "./email-service";
import { generateSMSCode, sendPasswordResetSMS } from "./sms-service";
import { hashPassword } from "./auth";

/**
 * Setup password reset routes
 */
export function setupPasswordResetRoutes(app: Express) {
  // Request password reset - step 1
  app.post("/api/forgot-password", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        email: z.string().email("Please enter a valid email address"),
        method: z.enum(["sms"], {
          required_error: "SMS is the only supported verification method",
        }).optional().default("sms"),
      });

      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
      }

      const { email, method } = result.data;

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security, don't reveal if email exists or not
        return res.status(200).json({ 
          message: "If an account with that email exists, you will receive a verification code.",
          requiresCode: true
        });
      }

      // Validate phone number since we only support SMS now
      if (!user.phone || user.phone.trim() === "") {
        return res.status(400).json({ 
          error: "No phone number associated with this account. Please contact support for assistance." 
        });
      }

      // Generate SMS code
      const { code, expires } = generateSMSCode();
      
      // Store code in database (we use the token field for the SMS code)
      await storage.updateUserResetToken(user.id, code, expires, "sms");
      
      // Send SMS
      const smsSent = await sendPasswordResetSMS(user.phone!, code, user.username);
      
      if (!smsSent) {
        return res.status(500).json({ 
          error: "Failed to send SMS. Please try again later." 
        });
      }
      
      return res.status(200).json({ 
        message: "Verification code sent to your phone number.",
        requiresCode: true // Frontend will show code input form
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      return res.status(500).json({ error: "An error occurred. Please try again." });
    }
  });

  // Verify SMS code - step 2 (only for SMS method)
  app.post("/api/verify-reset-code", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
      });

      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
      }

      const { email, code } = result.data;

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ error: "Invalid request." });
      }

      // Check if user has a valid SMS reset token
      if (!user.resetPasswordToken || user.resetPasswordMethod !== "sms") {
        return res.status(400).json({ error: "No SMS verification in progress." });
      }

      // Check if token is expired
      if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
        return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
      }

      // Verify code
      if (user.resetPasswordToken !== code) {
        return res.status(400).json({ error: "Invalid verification code." });
      }

      // Generate a temporary token for password reset (valid for 15 minutes)
      const { token, expires } = generatePasswordResetToken();
      const shortExpires = new Date();
      shortExpires.setMinutes(shortExpires.getMinutes() + 15); // 15 minutes only

      await storage.updateUserResetToken(user.id, token, shortExpires, "sms_verified");

      return res.status(200).json({ 
        message: "Code verified. You can now reset your password.",
        resetToken: token
      });
    } catch (error) {
      console.error("Verify reset code error:", error);
      return res.status(500).json({ error: "An error occurred. Please try again." });
    }
  });

  // Reset password - final step
  app.post("/api/reset-password", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        token: z.string().min(1, "Reset token is required"),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
      });

      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
      }

      const { token, newPassword } = result.data;

      // Find user by reset token
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired reset token." });
      }

      // Check if token is expired
      if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
        return res.status(400).json({ error: "Reset token has expired. Please request a new password reset." });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update user's password and clear reset token
      await storage.updateUserPassword(user.id, hashedPassword);

      return res.status(200).json({ 
        message: "Password reset successfully. You can now log in with your new password." 
      });
    } catch (error) {
      console.error("Reset password error:", error);
      return res.status(500).json({ error: "An error occurred. Please try again." });
    }
  });

  // Get reset form (for email links)
  app.get("/reset-password", (req: Request, res: Response) => {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).send(`
        <html>
          <head><title>Invalid Reset Link</title></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h2 style="color: #ef4444;">Invalid Reset Link</h2>
            <p>The password reset link is invalid or malformed.</p>
            <p><a href="/">Return to TableQueue</a></p>
          </body>
        </html>
      `);
    }

    // Redirect to frontend with token
    return res.redirect(`/?reset-token=${token}`);
  });
}