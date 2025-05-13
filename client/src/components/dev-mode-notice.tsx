import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export function DevModeNotice() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = React.useState(false);

  // If the notice has been dismissed, don't show it again
  if (dismissed) {
    return null;
  }

  return (
    <Alert 
      variant="default" 
      className={cn(
        "border-blue-500 bg-blue-50 text-blue-700 mb-4",
      )}
    >
      <div className="flex items-start">
        <Info className="h-5 w-5 mr-2 mt-0.5" />
        <div className="flex-1">
          <AlertTitle className="text-blue-800">Development Mode</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">
              Email verification is currently set to auto-verify accounts for development purposes.
              {user && !user.isVerified && 
                " In a production environment, you would need to verify your email address."
              }
            </p>
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDismissed(true)}
                className="mt-2 bg-white border-blue-200 hover:bg-blue-100 hover:text-blue-800"
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}