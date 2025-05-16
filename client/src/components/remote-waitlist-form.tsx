import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Restaurant } from '@shared/schema';

// Form schema for remote waitlist entry
const remoteWaitlistFormSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  partySize: z.coerce.number().min(1, 'Party size must be at least 1'),
  phoneNumber: z.string().min(10, 'Valid phone number required for remote queue'),
  email: z.string().email('Valid email required for confirmation').optional(),
  dietaryRequirements: z.string().optional(),
  notes: z.string().optional(),
});

type RemoteWaitlistFormValues = z.infer<typeof remoteWaitlistFormSchema>;

interface RemoteWaitlistFormProps {
  restaurant: Restaurant;
  onSuccess?: (data: any) => void;
  isScheduled?: boolean;
}

export const RemoteWaitlistForm = ({ restaurant, onSuccess, isScheduled = false }: RemoteWaitlistFormProps) => {
  const form = useForm<RemoteWaitlistFormValues>({
    resolver: zodResolver(remoteWaitlistFormSchema),
    defaultValues: {
      customerName: '',
      partySize: 2,
      phoneNumber: '',
      email: '',
      dietaryRequirements: '',
      notes: '',
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: RemoteWaitlistFormValues) => {
    try {
      // Submit remote waitlist entry
      const response = await apiRequest(
        `/api/restaurants/${restaurant.id}/remote-waitlist`,
        { method: 'POST', body: values }
      );

      const data = await response.json();
      toast({
        title: 'Added to Remote Waitlist',
        description: `You've been added to the waitlist with queue position #${data.queuePosition}! Your confirmation code is ${data.confirmationCode}. Please use this code when you arrive at the restaurant to preserve your position in line.`,
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
      console.error('Error submitting remote waitlist form:', error);
    }
  };

  // Generate time options from restaurant opening hours
  const generateTimeOptions = () => {
    // Default times if no operating hours available
    const times = [];
    for (let hour = 11; hour <= 22; hour++) {
      times.push(`${hour}:00`);
      times.push(`${hour}:30`);
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{restaurant.name} Digital Queue</CardTitle>
        <CardDescription className="space-y-2">
          {!isScheduled && (
            <>
              <p>Join the waitlist in advance and spend less time waiting</p>
              <p className="text-primary font-medium">Secure your spot in line now! Your position is reserved from the moment you submit this form.</p>
              <p className="text-amber-600 font-medium">⚠️ Important: You must check in physically within 15 minutes of your arrival time or your reservation will be automatically cancelled.</p>
            </>
          )}
          {isScheduled && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-3">Choose Arrival Time</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { time: '23:15', discount: '5% OFF' },
                  { time: '23:30', discount: '15% OFF' },
                  { time: '23:45', discount: '13% OFF' },
                  { time: '24:00', discount: '16% OFF' },
                  { time: '24:15', discount: '13% OFF' },
                  { time: '24:30', discount: '9% OFF' },
                  { time: '24:45', discount: '9% OFF' },
                  { time: '25:00', discount: '15% OFF' },
                  { time: '25:15', discount: '13% OFF' }
                ].map((slot) => (
                  <div key={slot.time} className="border rounded-md p-2 text-center cursor-pointer hover:border-primary">
                    <div>{slot.time}</div>
                    <div className="text-green-600 text-sm font-medium">{slot.discount}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                  <FormLabel>Phone Number <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Required for remote waitlist" {...field} />
                  </FormControl>
                  <FormDescription>
                    You'll receive text updates about your position in line
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isScheduled && <span className="text-red-500 mr-1">*</span>}Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="For confirmation details" {...field} />
                  </FormControl>
                  <FormDescription>
                    We'll send your confirmation code to this email
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
              {isSubmitting ? 'Submitting...' : isScheduled ? 'Schedule Arrival' : 'Join Queue Now'}
            </Button>
            {isScheduled && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                Schedule a future arrival to reduce your wait time and get special offers
              </p>
            )}
          </form>
        </Form>
      </CardContent>

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
    case 'very_long':
      return '60+ minutes';
    default:
      return 'Unknown';
  }
}

export default RemoteWaitlistForm;