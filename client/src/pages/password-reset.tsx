import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function PasswordResetPage() {
  const [location] = useLocation();
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Extract token from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('reset-token');
    
    if (resetToken) {
      setToken(resetToken);
    } else {
      setError("Invalid or missing reset token. Please request a new password reset.");
    }
  }, [location]);

  const handleResetPassword = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setError("No reset token found. Please request a new password reset.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await apiRequest({
        method: "POST",
        url: "/api/reset-password",
        body: {
          token,
          newPassword: data.newPassword,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password");
      }

      setSuccess(true);
      toast({
        title: "Success",
        description: result.message,
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

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Password Reset Successful</CardTitle>
            <CardDescription>
              Your password has been successfully updated. You can now log in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/auth">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <CardTitle className="text-2xl">Reset Your Password</CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {token && (
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

          {!token && (
            <div className="text-center">
              <Button asChild variant="outline" className="w-full">
                <Link href="/forgot-password">Request New Reset Link</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}