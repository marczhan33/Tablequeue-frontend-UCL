import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Restaurant, WaitlistEntry } from '@shared/schema';
import { CheckCircle, Loader2 } from 'lucide-react';

const checkinFormSchema = z.object({
  confirmationCode: z.string().min(5, "Please enter your confirmation code"),
});

type CheckinFormValues = z.infer<typeof checkinFormSchema>;

interface RemoteWaitlistCheckinProps {
  restaurant: Restaurant;
  onSuccess?: (data: WaitlistEntry) => void;
}

export const RemoteWaitlistCheckin = ({ restaurant, onSuccess }: RemoteWaitlistCheckinProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkInCompleted, setCheckInCompleted] = useState(false);
  
  const form = useForm<CheckinFormValues>({
    resolver: zodResolver(checkinFormSchema),
    defaultValues: {
      confirmationCode: '',
    },
  });

  const onSubmit = async (values: CheckinFormValues) => {
    try {
      setIsProcessing(true);
      
      // Submit check-in request
      const response = await apiRequest({
        url: `/api/restaurants/${restaurant.id}/remote-waitlist/checkin`,
        method: 'POST',
        body: values
      });

      const data = await response.json();
      
      if (response.ok) {
        setCheckInCompleted(true);
        toast({
          title: 'Check-in Successful',
          description: 'You have been successfully checked in! The staff will call your name shortly.',
        });
        
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        toast({
          title: 'Check-in Failed',
          description: data.message || 'Failed to check in with the provided code',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during check-in',
        variant: 'destructive',
      });
      console.error('Error during remote waitlist check-in:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (checkInCompleted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center flex items-center justify-center">
            <CheckCircle className="text-green-500 mr-2 h-6 w-6" /> Check-in Successful
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p>You've been successfully checked in at {restaurant.name}.</p>
          <p className="text-muted-foreground">The staff will call your name when your table is ready.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Check-in to {restaurant.name}</CardTitle>
        <CardDescription>
          Enter your confirmation code to check in to your remote waitlist spot
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="confirmationCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmation Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your 6-digit code" 
                      className="text-center text-lg tracking-wider" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    You received this code when you joined the remote waitlist
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking in...
                </>
              ) : (
                'Check In Now'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RemoteWaitlistCheckin;