import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

export default function WaitlistStatusPage() {
  const { restaurantId, entryId } = useParams<{ restaurantId: string; entryId: string }>();
  const [, navigate] = useLocation();
  
  // Fetch waitlist entry
  const { data: waitlistEntry, isLoading: isLoadingEntry, error: entryError } = useQuery({
    queryKey: ['/api/restaurants', restaurantId, 'waitlist', entryId],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/restaurants/${restaurantId}/waitlist/${entryId}`);
        return await response.json();
      } catch (error) {
        console.error('Error fetching waitlist entry:', error);
        throw error;
      }
    },
  });
  
  // Fetch restaurant info
  const { data: restaurant, isLoading: isLoadingRestaurant, error: restaurantError } = useQuery({
    queryKey: ['/api/restaurants', restaurantId],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/restaurants/${restaurantId}`);
        return await response.json();
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        throw error;
      }
    },
  });
  
  const isLoading = isLoadingEntry || isLoadingRestaurant;
  const error = entryError || restaurantError;
  
  // Format the status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'Waiting';
      case 'notified':
        return 'Notified - Table Ready!';
      case 'seated':
        return 'Seated';
      case 'cancelled':
        return 'Cancelled';
      case 'remote_pending':
        return 'Remote - Not Arrived Yet';
      case 'remote_confirmed':
        return 'Remote - On The Way';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    }
  };
  
  // Get status badge color
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'default';
      case 'notified':
        return 'warning';
      case 'seated':
        return 'success';
      case 'cancelled':
        return 'destructive';
      case 'remote_pending':
        return 'secondary';
      case 'remote_confirmed':
        return 'outline';
      default:
        return 'default';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading waitlist information...</p>
      </div>
    );
  }
  
  if (error || !waitlistEntry || !restaurant) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-xl text-center">Waitlist Entry Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-red-500">
            {(error as Error)?.message || 'Could not find waitlist entry.'}
          </p>
          <Button onClick={() => navigate('/')}>
            Return to Home Page
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Format arrival time if it exists (for remote waitlist entries)
  const formatArrivalTime = () => {
    if (!waitlistEntry.expectedArrivalTime) return null;
    
    const date = new Date(waitlistEntry.expectedArrivalTime);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  const isRemoteEntry = waitlistEntry.isRemote || 
                        waitlistEntry.status === 'remote_pending' || 
                        waitlistEntry.status === 'remote_confirmed';
  
  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/restaurants/${restaurant.id}`)}
          className="mb-4"
        >
          &larr; Back to Restaurant
        </Button>
      </div>
      
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Waitlist Status</CardTitle>
          <CardDescription>
            {restaurant.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg text-center">
            <h3 className="text-sm font-medium mb-1 text-muted-foreground">Current Status</h3>
            <Badge 
              variant={getStatusBadgeVariant(waitlistEntry.status)}
              className="text-lg font-semibold px-3 py-1 h-auto"
            >
              {getStatusText(waitlistEntry.status)}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-primary/10 rounded-lg">
              <h3 className="text-sm font-medium mb-1 text-muted-foreground">Queue Position</h3>
              <span className="text-2xl font-bold">{waitlistEntry.queuePosition}</span>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <h3 className="text-sm font-medium mb-1 text-muted-foreground">Wait Time</h3>
              <span className="text-2xl font-bold">{waitlistEntry.estimatedWaitTime} min</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{waitlistEntry.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Party Size:</span>
              <span className="font-medium">{waitlistEntry.partySize} people</span>
            </div>
            
            {/* Only show for remote entries */}
            {isRemoteEntry && formatArrivalTime() && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Arrival:</span>
                <span className="font-medium">{formatArrivalTime()}</span>
              </div>
            )}
            
            {waitlistEntry.phoneNumber && (
              <div className="flex justify-between">
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
            
            {isRemoteEntry && waitlistEntry.confirmationCode && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confirmation Code:</span>
                <span className="font-medium tracking-wider">{waitlistEntry.confirmationCode}</span>
              </div>
            )}
          </div>
          
          <Separator />
          
          {waitlistEntry.status === 'remote_pending' && (
            <div className="space-y-3">
              <h3 className="font-medium">Ready to check in?</h3>
              <p className="text-sm text-muted-foreground">
                When you arrive at the restaurant, use your confirmation code to check in and
                notify the staff that you're ready to be seated.
              </p>
              <Button 
                className="w-full"
                onClick={() => navigate(`/restaurants/${restaurant.id}/remote-waitlist`)}
              >
                Go to Check-in Page
              </Button>
            </div>
          )}
          
          {waitlistEntry.status === 'waiting' && (
            <div className="space-y-3">
              <h3 className="font-medium">What happens next?</h3>
              <p className="text-sm text-muted-foreground">
                We'll text you when your table is almost ready. Feel free to explore the area
                while you wait, but please be ready to return to the restaurant within 10 minutes
                of receiving your notification.
              </p>
            </div>
          )}
          
          {waitlistEntry.status === 'notified' && (
            <div className="space-y-3 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-medium text-yellow-800">Your table is ready!</h3>
              <p className="text-sm text-yellow-700">
                Please proceed to the host stand at {restaurant.name}. Your table is ready and
                waiting for you!
              </p>
            </div>
          )}
          
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
    </div>
  );
}