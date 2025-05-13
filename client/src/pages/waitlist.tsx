import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import WaitlistForm from '@/components/waitlist-form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import type { WaitlistEntry, Restaurant } from '@shared/schema';

interface WaitlistConfirmationProps {
  waitlistEntry: WaitlistEntry;
  restaurant: Restaurant;
}

const WaitlistConfirmation = ({ waitlistEntry, restaurant }: WaitlistConfirmationProps) => {
  const [, navigate] = useLocation();

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">You're on the Waitlist!</CardTitle>
        <CardDescription>
          Thank you for joining the waitlist at {restaurant.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted p-4 rounded-lg text-center">
          <h3 className="text-sm font-medium mb-1 text-muted-foreground">Your Queue Position</h3>
          <span className="text-4xl font-bold">{waitlistEntry.queuePosition}</span>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated Wait Time:</span>
            <span className="font-medium">{waitlistEntry.estimatedWaitTime} minutes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Party Size:</span>
            <span className="font-medium">{waitlistEntry.partySize} people</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant="outline">{waitlistEntry.status}</Badge>
          </div>
          
          {waitlistEntry.phoneNumber && (
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium">{waitlistEntry.phoneNumber}</span>
            </div>
          )}
          
          {waitlistEntry.dietaryRequirements && (
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Dietary Requirements:</span>
              <span className="font-medium text-right max-w-[200px]">{waitlistEntry.dietaryRequirements}</span>
            </div>
          )}
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <h3 className="font-medium">What happens next?</h3>
          <p className="text-sm text-muted-foreground">
            We'll text you when your table is almost ready. Feel free to explore the area
            while you wait, but please be ready to return to the restaurant within 10 minutes
            of receiving your notification.
          </p>
        </div>
        
        <div className="flex justify-center space-x-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/restaurants/${restaurant.id}`)}
          >
            Restaurant Details
          </Button>
          <Button
            className="flex-1"
            onClick={() => window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`}
          >
            Get Directions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function WaitlistPage() {
  const { qrCodeId } = useParams();
  const [, navigate] = useLocation();
  const [waitlistEntry, setWaitlistEntry] = useState<WaitlistEntry | null>(null);
  
  // Fetch restaurant by QR code ID
  const { data: restaurant, isLoading, error } = useQuery({
    queryKey: ['/api/restaurants/qr', qrCodeId],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/restaurants/qr/${qrCodeId}`);
        return await response.json();
      } catch (error) {
        console.error('Error fetching restaurant by QR code:', error);
        throw error;
      }
    },
  });
  
  const handleWaitlistSuccess = (data: WaitlistEntry) => {
    setWaitlistEntry(data);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading restaurant information...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-xl text-center">QR Code Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-red-500">
            {(error as Error).message || 'Could not find restaurant with this QR code.'}
          </p>
          <Button onClick={() => navigate('/')}>
            Return to Home Page
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (!restaurant) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-xl text-center">Invalid QR Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-red-500">
            This QR code is not associated with any restaurant.
          </p>
          <Button onClick={() => navigate('/')}>
            Return to Home Page
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          &larr; Back to Home
        </Button>
      </div>
      
      {waitlistEntry ? (
        <WaitlistConfirmation waitlistEntry={waitlistEntry} restaurant={restaurant} />
      ) : (
        <WaitlistForm restaurant={restaurant} onSuccess={handleWaitlistSuccess} />
      )}
    </div>
  );
}