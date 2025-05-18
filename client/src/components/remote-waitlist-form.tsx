import React, { useState, useCallback, useEffect } from 'react';
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

// Helper function to convert wait status to estimated minutes
function getEstimatedWaitTimeMinutes(status: string): number {
  switch (status) {
    case 'available':
      return 5;
    case 'short':
      return 20;
    case 'long':
      return 45;
    case 'very_long':
      return 75;
    default:
      return 15; // Default 15 minute wait
  }
}

// Helper function to get text description of wait status
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

// Form schema for remote waitlist entry
const remoteWaitlistFormSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  partySize: z.coerce.number().min(1, 'Party size must be at least 1'),
  phoneNumber: z.string().min(10, 'Valid phone number required for remote queue'),
  email: z.string().email('Valid email required for confirmation').optional(),
  dietaryRequirements: z.string().optional(),
  notes: z.string().optional(),
  // Always set by the code, so it doesn't need to be filled by the user
  expectedArrivalTime: z.string().optional(), 
});

type RemoteWaitlistFormValues = z.infer<typeof remoteWaitlistFormSchema>;

interface RemoteWaitlistFormProps {
  restaurant: Restaurant;
  onSuccess?: (data: any) => void;
  isScheduled?: boolean;
}

export const RemoteWaitlistForm = ({ restaurant, onSuccess, isScheduled = false }: RemoteWaitlistFormProps) => {
  const [selectedTime, setSelectedTime] = useState<string>('');
  const form = useForm<RemoteWaitlistFormValues>({
    resolver: zodResolver(remoteWaitlistFormSchema),
    defaultValues: {
      customerName: '',
      partySize: 2,
      phoneNumber: '',
      email: '',
      dietaryRequirements: '',
      notes: '',
      expectedArrivalTime: '',
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: RemoteWaitlistFormValues) => {
    try {
      // Add expected arrival time and estimated wait time for entries
      let formattedValues = { 
        ...values,
        partySize: Number(values.partySize),
        // Add estimatedWaitTime to meet database requirement
        estimatedWaitTime: getEstimatedWaitTimeMinutes(restaurant.currentWaitStatus)
      };
      
      // If this is a scheduled entry, set the expected arrival time
      if (isScheduled && selectedTime) {
        // Create a date object for today with the selected time
        const today = new Date();
        const [hours, minutes] = selectedTime.split(':').map(Number);
        
        today.setHours(hours, minutes, 0, 0);
        formattedValues.expectedArrivalTime = today.toISOString();
      } else {
        // For immediate entries, set expected arrival time to now + 15 minutes
        const arrivalTime = new Date();
        arrivalTime.setMinutes(arrivalTime.getMinutes() + 15);
        formattedValues.expectedArrivalTime = arrivalTime.toISOString();
      }
      
      // Submit remote waitlist entry
      const response = await apiRequest({
        url: `/api/restaurants/${restaurant.id}/remote-waitlist`,
        method: 'POST', 
        body: formattedValues
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join waitlist');
      }

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
      console.error('Error submitting remote waitlist form:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred while joining the waitlist',
        variant: 'destructive',
      });
    }
  };

  // Fetch promotional offers for time slots
  const fetchPromotionalOffers = useCallback(async () => {
    try {
      // Try to get real promotional offers from the API
      const response = await fetch(`/api/restaurants/${restaurant.id}/promotions`);
      
      if (response.ok) {
        const promotions = await response.json();
        
        // If we have real promotions, use them
        if (promotions && promotions.length > 0) {
          return promotions.map((p: {timeSlot: string, discount: number}) => ({
            time: p.timeSlot,
            discount: p.discount
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching promotional offers:", error);
    }
    
    // Fallback to consistent default promotional offers if API fails
    // or there are no configured promotions for this restaurant
    const timesWithDiscount = [];
    
    // Morning/early afternoon (off-peak, higher discounts)
    for (let hour = 11; hour <= 15; hour++) {
      // Generate consistent discounts based on hour
      const morningDiscount = 15; // 15% discount for morning slots
      const noonDiscount = hour >= 12 && hour <= 13 ? 5 : 15; // Lower discount during lunch rush
      
      timesWithDiscount.push({ time: `${hour}:00`, discount: morningDiscount });
      timesWithDiscount.push({ time: `${hour}:30`, discount: noonDiscount });
    }
    
    // Peak dinner hours (lower discounts)
    for (let hour = 16; hour <= 20; hour++) {
      // Peak hours have lower discounts
      const earlyDiscount = hour === 16 ? 5 : hour === 17 ? 0 : 0; 
      const lateDiscount = hour === 19 ? 0 : hour === 20 ? 5 : 0;
      
      timesWithDiscount.push({ time: `${hour}:00`, discount: earlyDiscount });
      timesWithDiscount.push({ time: `${hour}:30`, discount: lateDiscount });
    }
    
    // Late night (higher discounts again)
    for (let hour = 21; hour <= 22; hour++) {
      const lateDiscount = 10; // 10% discount for late night
      
      timesWithDiscount.push({ time: `${hour}:00`, discount: lateDiscount });
      timesWithDiscount.push({ time: `${hour}:30`, discount: lateDiscount });
    }
    
    return timesWithDiscount;
  }, []);

  // State for time options with their discounts  
  const [timeOptions, setTimeOptions] = useState<{time: string, discount: number}[]>([]);
  
  // Load time options on component mount
  useEffect(() => {
    const loadTimeOptions = async () => {
      const options = await fetchPromotionalOffers();
      setTimeOptions(options);
    };
    
    loadTimeOptions();
  }, [fetchPromotionalOffers]);

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
                {timeOptions.map((slot) => (
                  <div 
                    key={slot.time} 
                    onClick={() => setSelectedTime(slot.time)}
                    className={`border rounded-md p-2 text-center cursor-pointer transition-colors ${
                      selectedTime === slot.time 
                        ? "border-primary bg-primary/10" 
                        : "hover:border-primary/50"
                    }`}
                  >
                    <div className="font-medium">{slot.time}</div>
                    {slot.discount > 0 && (
                      <div className="text-green-600 text-xs font-semibold mt-1">
                        {slot.discount}% OFF
                      </div>
                    )}
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
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || (isScheduled && !selectedTime)}
            >
              {isSubmitting ? 'Submitting...' : isScheduled ? 'Schedule Arrival' : 'Join Queue Now'}
            </Button>
            {isScheduled && !selectedTime && (
              <p className="text-center text-xs text-red-500 mt-2">
                Please select an arrival time above
              </p>
            )}
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



export default RemoteWaitlistForm;