import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Restaurant, WaitlistEntry } from '@shared/schema';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { CheckCircle, Loader2, MapPin, QrCode, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const checkinFormSchema = z.object({
  confirmationCode: z.string().min(5, "Please enter your confirmation code"),
  verificationMethod: z.enum(['qrcode', 'location']).default('qrcode'),
});

type CheckinFormValues = z.infer<typeof checkinFormSchema>;

interface RemoteWaitlistCheckinProps {
  restaurant: Restaurant;
  onSuccess?: (data: WaitlistEntry) => void;
}

export const RemoteWaitlistCheckin = ({ restaurant, onSuccess }: RemoteWaitlistCheckinProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkInCompleted, setCheckInCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState('qrcode');
  const [isVerified, setIsVerified] = useState(false);
  const [isNearRestaurant, setIsNearRestaurant] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const form = useForm<CheckinFormValues>({
    resolver: zodResolver(checkinFormSchema),
    defaultValues: {
      confirmationCode: '',
      verificationMethod: 'qrcode',
    },
  });

  // Function to check if user is near the restaurant using geolocation
  const checkLocation = () => {
    setLocationError(null);
    setIsProcessing(true);
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsProcessing(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Get the user's current location
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        // Get restaurant location from our data
        const restaurantLat = parseFloat(restaurant.latitude);
        const restaurantLng = parseFloat(restaurant.longitude);
        
        // Calculate distance between user and restaurant (simplified version)
        const distance = calculateDistance(userLat, userLng, restaurantLat, restaurantLng);
        
        // If user is within 100 meters of the restaurant, consider them verified
        if (distance <= 0.1) { // 0.1 km = 100 meters
          setIsNearRestaurant(true);
          setIsVerified(true);
          toast({
            title: 'Location Verified',
            description: 'You are at or near the restaurant. You can now check in!',
          });
        } else {
          setIsNearRestaurant(false);
          setLocationError(`You appear to be ${distance.toFixed(1)} km away from the restaurant. Please try again when you arrive.`);
        }
        setIsProcessing(false);
      },
      (error) => {
        setLocationError(`Location error: ${error.message}`);
        setIsProcessing(false);
      },
      { enableHighAccuracy: true }
    );
  };
  
  // Simple function to calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  };
  
  const deg2rad = (deg: number) => {
    return deg * (Math.PI/180);
  };
  
  // Handle QR code scan verification
  const handleQRScan = () => {
    // Simulate QR code scanning - in a real app, this would use the device camera
    // For now we'll just simulate successful verification
    setIsVerified(true);
    toast({
      title: 'QR Code Verified',
      description: 'Restaurant QR code successfully scanned. You can now check in!',
    });
  };

  const onSubmit = async (values: CheckinFormValues) => {
    try {
      // Check if user has verified their physical presence
      if (!isVerified) {
        toast({
          title: 'Verification Required',
          description: 'Please verify your presence at the restaurant first',
          variant: 'destructive',
        });
        return;
      }
      
      setIsProcessing(true);
      
      // Submit check-in request with verification method
      const response = await apiRequest({
        url: `/api/restaurants/${restaurant.id}/remote-waitlist/checkin`,
        method: 'POST',
        body: {
          confirmationCode: values.confirmationCode,
          verificationMethod: values.verificationMethod
        }
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
          <p>Your <span className="font-medium">original queue position</span> has been preserved!</p>
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
          Enter your confirmation code and verify your physical presence
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Physical Verification Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Step 1: Verify Your Presence</h3>
          
          <Tabs defaultValue="qrcode" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qrcode">
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR Code
              </TabsTrigger>
              <TabsTrigger value="location">
                <MapPin className="h-4 w-4 mr-2" />
                Use Location
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="qrcode" className="space-y-4 mt-4">
              <div className="text-center p-6 border border-dashed rounded-md">
                <QrCode className="h-20 w-20 mx-auto mb-4 text-primary" />
                <p className="mb-4">Scan the QR code at the restaurant entrance</p>
                
                {/* This is a simplified simulation since we can't use the actual camera */}
                <Button onClick={handleQRScan} variant="outline" disabled={isVerified}>
                  {isVerified ? 'QR Code Verified' : 'Simulate QR Scan'}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="location" className="space-y-4 mt-4">
              <div className="text-center p-6 border border-dashed rounded-md">
                <MapPin className="h-20 w-20 mx-auto mb-4 text-primary" />
                <p className="mb-4">Verify you're at the restaurant using your location</p>
                
                {locationError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Location Error</AlertTitle>
                    <AlertDescription>{locationError}</AlertDescription>
                  </Alert>
                )}
                
                {isNearRestaurant && (
                  <Alert variant="success" className="mb-4 bg-green-50 text-green-800 border-green-200">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Location Verified</AlertTitle>
                    <AlertDescription>You're at the restaurant!</AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  onClick={checkLocation} 
                  variant="outline" 
                  disabled={isProcessing || isVerified}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking location...
                    </>
                  ) : isVerified ? (
                    'Location Verified'
                  ) : (
                    'Verify Location'
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          {isVerified && (
            <div className="mt-2 text-center">
              <p className="text-sm text-green-600 font-medium">
                ✓ Physical presence verified! You can now check in.
              </p>
            </div>
          )}
        </div>
        
        {/* Confirmation Code Section */}
        <div>
          <h3 className="text-lg font-medium mb-2">Step 2: Enter Your Code</h3>
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
                disabled={isProcessing || !isVerified}
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
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col pt-0">
        <p className="text-sm text-amber-600 mt-4">
          <AlertTriangle className="inline-block mr-1 h-4 w-4" />
          If you don't check in within 15 minutes of your arrival time, your spot in line will be cancelled.
        </p>
      </CardFooter>
    </Card>
  );
};

export default RemoteWaitlistCheckin;