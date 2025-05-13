import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Restaurant } from '@shared/schema';

// Form schema for customer waitlist entry
const waitlistFormSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  partySize: z.coerce.number().min(1, 'Party size must be at least 1'),
  phoneNumber: z.string().optional(),
  dietaryRequirements: z.string().optional(),
  notes: z.string().optional(),
});

type WaitlistFormValues = z.infer<typeof waitlistFormSchema>;

interface WaitlistFormProps {
  restaurant: Restaurant;
  onSuccess?: (data: any) => void;
}

export const WaitlistForm = ({ restaurant, onSuccess }: WaitlistFormProps) => {
  const form = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistFormSchema),
    defaultValues: {
      customerName: '',
      partySize: 2,
      phoneNumber: '',
      dietaryRequirements: '',
      notes: '',
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: WaitlistFormValues) => {
    try {
      // Submit waitlist entry
      const response = await apiRequest({
        url: `/api/restaurants/${restaurant.id}/waitlist`,
        method: 'POST',
        body: values
      });

      const data = await response.json();
      toast({
        title: 'Added to Waitlist',
        description: `You've been added to the waitlist! Your estimated wait time is ${data.estimatedWaitTime} minutes.`,
      });
      
      if (onSuccess) {
        onSuccess(data);
      }
      
      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while joining the waitlist',
        variant: 'destructive',
      });
      console.error('Error submitting waitlist form:', error);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{restaurant.name} Waitlist</CardTitle>
        <CardDescription>
          Join the waitlist to be notified when your table is ready
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="partySize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Party Size</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormDescription>
                    How many people will be dining?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="For SMS notifications" {...field} />
                  </FormControl>
                  <FormDescription>
                    We'll text you when your table is ready
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dietaryRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dietary Requirements (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any allergies or dietary restrictions?"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special requests or notes for the restaurant?"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Join Waitlist'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col">
        <p className="text-sm text-muted-foreground text-center">
          Current wait time: {restaurant.customWaitTime && restaurant.customWaitTime > 0 
            ? `Approximately ${restaurant.customWaitTime} minutes` 
            : getWaitTimeText(restaurant.currentWaitStatus)}
        </p>
      </CardFooter>
    </Card>
  );
};

function getWaitTimeText(status: string): string {
  switch (status) {
    case 'available':
      return 'No wait time';
    case 'short':
      return '15-30 minutes';
    case 'long':
      return '30+ minutes';
    default:
      return 'Unknown';
  }
}

export default WaitlistForm;