import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { createGoogleMapsUrl } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Info } from 'lucide-react';
import RemoteWaitlistForm from '@/components/remote-waitlist-form';
import RemoteWaitlistCheckin from '@/components/remote-waitlist-checkin';
import type { WaitlistEntry, Restaurant } from '@shared/schema';

interface RemoteWaitlistSuccessProps {
  waitlistEntry: WaitlistEntry;
  restaurant: Restaurant;
}

const RemoteWaitlistSuccess = ({ waitlistEntry, restaurant }: RemoteWaitlistSuccessProps) => {
  const [, navigate] = useLocation();
  
  // Format the expected arrival time nicely
  const formatArrivalTime = () => {
    if (!waitlistEntry.expectedArrivalTime) return 'Not specified';
    
    const date = new Date(waitlistEntry.expectedArrivalTime);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Remote Waitlist Confirmed!</CardTitle>
        <CardDescription>
          You've been added to the remote waitlist at {restaurant.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-primary/10 p-4 rounded-lg text-center">
          <h3 className="text-sm font-medium mb-1 text-muted-foreground">Your Confirmation Code</h3>
          <span className="text-3xl font-bold tracking-widest">{waitlistEntry.confirmationCode}</span>
          <p className="text-sm text-muted-foreground mt-2">
            Please save this code - you'll need it when you arrive at the restaurant
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expected Arrival:</span>
            <span className="font-medium">{formatArrivalTime()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Party Size:</span>
            <span className="font-medium">{waitlistEntry.partySize} people</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated Wait Time:</span>
            <span className="font-medium">{waitlistEntry.estimatedWaitTime} minutes</span>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <h3 className="font-medium">What to do next?</h3>
          <div className="flex items-start space-x-2 text-sm text-muted-foreground">
            <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p>
              When you arrive at {restaurant.name}, click "Check In Now" below to let the staff know you've arrived. 
              Your confirmation code will be automatically filled in for you. Your position in the waitlist 
              will be activated and you'll be seated according to your party size and availability.
            </p>
          </div>
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
            variant="default"
            onClick={() => {
              // Create a custom event to store the confirmation code in session storage
              // This will persist across page loads
              if (waitlistEntry.confirmationCode) {
                sessionStorage.setItem('confirmationCode', waitlistEntry.confirmationCode);
                sessionStorage.setItem('activeTab', 'checkin');
                // Force a full page reload to ensure state is reset
                window.location.href = `/restaurants/${restaurant.id}/remote-waitlist`;
              }
            }}
          >
            Check In Now
          </Button>
        </div>
        
        <div className="flex justify-center mt-4">
          <Button 
            variant="default"
            className="flex-1"
            onClick={() => {
              const mapsUrl = createGoogleMapsUrl(
                restaurant.name,
                restaurant.address,
                restaurant.latitude,
                restaurant.longitude
              );
              window.open(mapsUrl, '_blank');
            }}
          >
            Get Directions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function RemoteWaitlistPage() {
  const { id } = useParams<{ id: string }>();
  const [location, navigate] = useLocation();
  const [waitlistEntry, setWaitlistEntry] = useState<WaitlistEntry | null>(null);
  
  // Check session storage first for any saved values
  const [activeTab, setActiveTab] = useState(() => {
    // Check if we have a saved tab value in session storage
    const savedTab = typeof window !== 'undefined' ? sessionStorage.getItem('activeTab') : null;
    if (savedTab) {
      // Clear it after reading
      sessionStorage.removeItem('activeTab');
      return savedTab;
    }
    
    // Fallback to URL parameters
    const searchParams = new URLSearchParams(location.split('?')[1]);
    return searchParams.get('tab') || 'join';
  });
  
  // Get confirmation code from session storage or URL
  const [confirmationCode, setConfirmationCode] = useState<string>('');
  
  useEffect(() => {
    const savedCode = typeof window !== 'undefined' ? sessionStorage.getItem('confirmationCode') : null;
    if (savedCode) {
      setConfirmationCode(savedCode);
      // Don't clear it immediately, let it persist for the session
    } else {
      // Fallback to URL parameters
      const searchParams = new URLSearchParams(location.split('?')[1]);
      const urlCode = searchParams.get('code') || '';
      setConfirmationCode(urlCode);
    }
  }, [location]);
  
  // Fetch restaurant by ID
  const { data: restaurant, isLoading, error } = useQuery({
    queryKey: ['/api/restaurants', id],
    queryFn: async () => {
      try {
        if (!id || isNaN(parseInt(id))) {
          throw new Error("Invalid restaurant ID");
        }
        const response = await apiRequest({
          url: `/api/restaurants/${id}`,
          method: 'GET'
        });
        return await response.json();
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        throw error;
      }
    },
  });
  
  const handleWaitlistSuccess = (data: WaitlistEntry) => {
    setWaitlistEntry(data);
  };
  
  const handleCheckinSuccess = (data: WaitlistEntry) => {
    // Redirect to regular waitlist status page or show check-in confirmation
    navigate(`/restaurants/${id}/waitlist-status/${data.id}`);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading restaurant information...</p>
      </div>
    );
  }
  
  if (error || !restaurant) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-xl text-center">Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-red-500">
            {(error as Error)?.message || 'Could not find restaurant.'}
          </p>
          <Button onClick={() => navigate('/')}>
            Return to Home Page
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // If a waitlist entry was just created, show the success view
  // Show the same success view for both immediate and scheduled entries
  if (waitlistEntry && (activeTab === 'join' || activeTab === 'schedule')) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/restaurants/${id}`)}
            className="mb-4"
          >
            &larr; Back to Restaurant
          </Button>
        </div>
        
        <RemoteWaitlistSuccess waitlistEntry={waitlistEntry} restaurant={restaurant} />
      </div>
    );
  }
  
  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/restaurants/${id}`)}
          className="mb-4"
        >
          &larr; Back to Restaurant
        </Button>
      </div>
      
      <h1 className="text-2xl font-bold mb-6 text-center">{restaurant.name} Digital Queue</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-lg mx-auto">
        <TabsList className="grid grid-cols-3 w-full mb-6">
          <TabsTrigger value="join">Join Waitlist</TabsTrigger>
          <TabsTrigger value="schedule">Schedule For Later</TabsTrigger>
          <TabsTrigger value="checkin">Check In</TabsTrigger>
        </TabsList>
        
        <TabsContent value="join">
          <RemoteWaitlistForm restaurant={restaurant} onSuccess={handleWaitlistSuccess} />
        </TabsContent>
        
        <TabsContent value="schedule">
          <RemoteWaitlistForm restaurant={restaurant} onSuccess={handleWaitlistSuccess} isScheduled={true} />
        </TabsContent>
        
        <TabsContent value="checkin">
          <RemoteWaitlistCheckin 
            restaurant={restaurant} 
            confirmationCode={confirmationCode || ''} 
            onSuccess={handleCheckinSuccess} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}