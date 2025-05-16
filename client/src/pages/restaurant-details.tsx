import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Restaurant } from "@shared/schema";
import LocationWaitTime from "@/components/location-wait-time";
import { GoogleMapsWaitTime } from "@/components/ui/google-maps-wait-time";

import { SmartCapacityDisplay } from "@/components/smart-capacity-display";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import DigitalQueueButton from "@/components/digital-queue-button";

const RestaurantDetails = () => {
  const [_, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const restaurantId = params?.id;
  const [partySize, setPartySize] = useState(2);
  const { toast } = useToast();
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
      
      <div>
        <LocationWaitTime restaurant={restaurant} />
      </div>
      
      <div className="mt-6 mb-8 w-full">
        <div className="w-full mb-4">
          <div className="flex flex-col md:flex-row items-center w-full gap-4">
            <div className="w-full md:w-1/3 lg:w-1/4">
              <DigitalQueueButton 
                restaurantId={restaurant.id} 
                className="w-full text-lg py-6"
              />
            </div>
            
            <div className="w-full md:w-2/3 lg:w-3/4 flex items-center">
              <p className="text-base md:text-lg text-muted-foreground">
                Join the waitlist in advance and spend less time waiting
              </p>
              
              {user && (user.role === 'owner' || user.role === 'admin') && (
                <Button 
                  className="ml-auto hidden md:flex" 
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation(`/restaurants/${restaurant.id}/analytics`)}
                >
                  <TrendingUp className="h-5 w-5 mr-2" />
                  View Analytics
                </Button>
              )}
            </div>
            
            {user && (user.role === 'owner' || user.role === 'admin') && (
              <Button 
                className="w-full md:hidden" 
                size="lg"
                variant="outline"
                onClick={() => setLocation(`/restaurants/${restaurant.id}/analytics`)}
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                View Analytics
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 mb-4">
        <h2 className="text-2xl font-bold mb-4">Smart Wait Management</h2>
        
        <div className="w-full">
          <Card className="h-full border shadow-sm">
            <CardHeader>
              <CardTitle>Advanced Wait Time Prediction</CardTitle>
              <CardDescription>
                Get personalized wait time estimates based on your party size
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <Label htmlFor="partySize" className="text-base">Party Size</Label>
                  <div className="flex items-center mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPartySize(Math.max(1, partySize - 1))}
                      disabled={partySize <= 1}
                      className="px-3 h-9 w-9"
                    >
                      -
                    </Button>
                    <div className="mx-4 w-10 text-center font-medium text-lg">{partySize}</div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPartySize(partySize + 1)}
                      className="px-3 h-9 w-9"
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                {restaurantId && (
                  <SmartCapacityDisplay 
                    restaurantId={parseInt(restaurantId)} 
                    partySize={partySize} 
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-primary/5 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold mb-3">Optimize Your Dining Experience</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Our smart wait system uses demand prediction technology to help you find the best times to dine with shorter waits.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="bg-white/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Schedule For Off-Peak</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Dining between 2-5pm or after 8:30pm typically has 60% shorter wait times and offers special discounts.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Remote Check-In</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Join our waitlist before leaving home and arrive just in time for your table.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Table Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Our smart system matches your party size to the right table to reduce unnecessary waiting.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Additional content like reviews could be added here */}
    </div>
  );
};

export default RestaurantDetails;