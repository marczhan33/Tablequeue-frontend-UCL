import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Check, AlertTriangle, Mail, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function VerificationStatus() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);

  // Since we're auto-verifying users in development mode, 
  // we'll hide this component completely for now
  // When email verification is properly set up, this logic will be useful
  return null;

  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      
      const response = await apiRequest({
        url: '/api/resend-verification',
        method: 'POST'
      });
      
      if (response.ok) {
        toast({
          title: 'Verification email sent',
          description: 'Please check your inbox for the verification link',
          variant: 'default',
        });
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      toast({
        title: 'Failed to send verification email',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Alert 
      variant="default" 
      className={cn(
        "border-amber-500 bg-amber-50 text-amber-700 mb-4",
      )}
    >
      <AlertTriangle className="h-5 w-5 mr-2" />
      <AlertTitle className="text-amber-800">Verify your email address</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          Please verify your email address to access all features. 
          We've sent a verification link to <strong>{user.email}</strong>.
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleResendVerification}
          disabled={isResending}
          className="mt-2 bg-white"
        >
          {isResending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Resend verification email
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function VerificationSuccess() {
  return (
    <Alert 
      variant="default" 
      className={cn(
        "border-green-500 bg-green-50 text-green-700 mb-4",
      )}
    >
      <Check className="h-5 w-5 mr-2" />
      <AlertTitle className="text-green-800">Email verified successfully!</AlertTitle>
      <AlertDescription>
        Your email has been verified and your account is now fully activated.
      </AlertDescription>
    </Alert>
  );
}