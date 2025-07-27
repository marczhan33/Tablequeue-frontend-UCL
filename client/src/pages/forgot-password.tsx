import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, Phone, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";

// Step 1: Request reset
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  method: z.enum(["email", "sms"], {
    required_error: "Please select a verification method",
  }),
});

// Step 2: Verify SMS code  
const verifyCodeSchema = z.object({
  code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
});

// Step 3: Reset password
const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
type VerifyCodeFormValues = z.infer<typeof verifyCodeSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "verify" | "reset">("request");
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<"email" | "sms">("email");
  const [resetToken, setResetToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Step 1 form
  const forgotForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      method: "email",
    },
  });

  // Step 2 form
  const verifyForm = useForm<VerifyCodeFormValues>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: {
      code: "",
    },
  });

  // Step 3 form
  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleForgotPassword = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiRequest({
        method: "POST",
        url: "/api/forgot-password",
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process request");
      }

      setEmail(data.email);
      setMethod(data.method);
      setMessage(result.message);

      if (result.requiresCode) {
        // SMS method - go to verification step
        setStep("verify");
      } else {
        // Email method - show success message
        toast({
          title: "Email sent",
          description: result.message,
        });
      }
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (data: VerifyCodeFormValues) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await apiRequest({
        method: "POST",
        url: "/api/verify-reset-code",
        body: {
          email,
          code: data.code,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to verify code");
      }

      setResetToken(result.resetToken);
      setMessage(result.message);
      setStep("reset");

      toast({
        title: "Code verified",
        description: "You can now reset your password",
      });
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await apiRequest({
        method: "POST",
        url: "/api/reset-password",
        body: {
          token: resetToken,
          newPassword: data.newPassword,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password");
      }

      toast({
        title: "Success",
        description: result.message,
      });

      // Redirect to login after success
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <CardTitle className="text-2xl">
                {step === "request" && "Forgot Password"}
                {step === "verify" && "Enter Verification Code"}
                {step === "reset" && "Create New Password"}
              </CardTitle>
              <CardDescription>
                {step === "request" && "Choose how you'd like to reset your password"}
                {step === "verify" && "Enter the 6-digit code sent to your phone"}
                {step === "reset" && "Enter your new password"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Request Reset */}
          {step === "request" && (
            <Form {...forgotForm}>
              <form onSubmit={forgotForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                <FormField
                  control={forgotForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter your email address" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={forgotForm.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Verification Method</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="email" id="email" />
                            <Label htmlFor="email" className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Send reset link to email
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sms" id="sms" />
                            <Label htmlFor="sms" className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Send code to phone number
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Send Reset Code"
                  )}
                </Button>
              </form>
            </Form>
          )}

          {/* Step 2: Verify SMS Code */}
          {step === "verify" && (
            <Form {...verifyForm}>
              <form onSubmit={verifyForm.handleSubmit(handleVerifyCode)} className="space-y-4">
                <FormField
                  control={verifyForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          placeholder="000000" 
                          maxLength={6}
                          className="text-center text-lg tracking-widest"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setStep("request")}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Step 3: Reset Password */}
          {step === "reset" && (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
                <FormField
                  control={resetForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resetForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </Form>
          )}

          {step === "request" && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Back to login
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}