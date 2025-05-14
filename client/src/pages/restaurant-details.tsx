import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Restaurant } from "@shared/schema";
import LocationWaitTime from "@/components/location-wait-time";
import { SmartCapacityDisplay } from "@/components/smart-capacity-display";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const RestaurantDetails = () => {
  const [_, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const restaurantId = params?.id;
  const [partySize, setPartySize] = useState(2);
  const { user } = useAuth();
  
  // Fetch restaurant by ID with a simple try/catch for better error handling
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (restaurantId) {
      setIsLoading(true);
      
      fetch(`/api/restaurants/${restaurantId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch restaurant (status ${response.status})`);
          }
          return response.json();
        })
        .then(data => {
          setRestaurant(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error fetching restaurant:', err);
          setError(err);
          setIsLoading(false);
        });
    }
  }, [restaurantId]);
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded-xl mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-gray-200 rounded-xl"></div>
          <div className="h-48 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }
  
  // Handle error state
  if (error || !restaurant) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Restaurant not found</p>
              <p className="text-sm mt-1">The restaurant you're looking for could not be found or is no longer available.</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setLocation('/')} 
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
        >
          Return to Restaurant List
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <button 
          onClick={() => setLocation('/')} 
          className="text-secondary hover:text-primary transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to Restaurant List
        </button>
      </div>
      
      <LocationWaitTime restaurant={restaurant} />
      
      <div className="mt-6 mb-8 flex flex-col md:flex-row gap-4 items-center justify-center">
        <Button 
          className="w-full md:w-auto" 
          size="lg"
          onClick={() => setLocation(`/restaurants/${restaurant.id}/remote-waitlist`)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <path d="M12 11h4"></path>
            <path d="M12 16h4"></path>
            <path d="M8 11h.01"></path>
            <path d="M8 16h.01"></path>
          </svg>
          Join Remote Waitlist
        </Button>
        
        {user && (user.role === 'owner' || user.role === 'admin') && (
          <Button 
            className="w-full md:w-auto" 
            size="lg"
            variant="outline"
            onClick={() => setLocation(`/restaurants/${restaurant.id}/analytics`)}
          >
            <TrendingUp className="h-5 w-5 mr-2" />
            View Analytics
          </Button>
        )}
        
        <div className="text-sm text-muted-foreground text-center md:text-left">
          Join the waitlist before you arrive and get notified when your table is almost ready!
        </div>
      </div>
      
      <div className="mt-8 mb-4">
        <h2 className="text-2xl font-bold mb-4">Smart Wait Time Prediction</h2>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Check Specific Wait Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="partySize">Party Size</Label>
                <div className="flex items-center mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPartySize(Math.max(1, partySize - 1))}
                    disabled={partySize <= 1}
                    className="px-3"
                  >
                    -
                  </Button>
                  <div className="mx-3 w-10 text-center font-medium">{partySize}</div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPartySize(partySize + 1)}
                    className="px-3"
                  >
                    +
                  </Button>
                </div>
              </div>
              
              <div className="col-span-2">
                <p className="text-sm text-gray-500 mb-2">
                  Get a more accurate wait time prediction based on your party size, current reservations, and historical data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Display the prediction results */}
        {restaurantId && (
          <SmartCapacityDisplay 
            restaurantId={parseInt(restaurantId)} 
            partySize={partySize} 
          />
        )}
      </div>
      
      {/* Additional content like reviews could be added here */}
    </div>
  );
};

export default RestaurantDetails;