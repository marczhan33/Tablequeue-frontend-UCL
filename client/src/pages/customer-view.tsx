import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Restaurant, WaitStatus } from "@shared/schema";
import SearchBar from "@/components/search-bar";
import RestaurantCard from "@/components/restaurant-card";
import FeaturedRestaurant from "@/components/featured-restaurant";
import { useToast } from "@/hooks/use-toast";
import { RestaurantFilters, FilterState } from "@/components/restaurant-filters";
import { calculateDistance } from "@/utils/geo-utils";

const CustomerView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    waitTime: null,
    cuisine: null,
    nearMe: false
  });
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Reference to track if geolocation is already being requested
  const isRequestingLocation = useRef(false);
  
  // Fetch all restaurants
  const { data: restaurants, isLoading, error } = useQuery<Restaurant[]>({
    queryKey: ['/api/restaurants'],
  });
  
  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // In a full implementation, this would trigger a filtered query to the backend
    toast({
      title: "Search initiated",
      description: `Searching for: ${query}`,
    });
  };
  
  // Function to get user's location
  const getUserLocation = () => {
    // Don't request location multiple times simultaneously
    if (isRequestingLocation.current) return;
    
    setLocationError(null);
    isRequestingLocation.current = true;
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      isRequestingLocation.current = false;
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive"
      });
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Store user's current location
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        isRequestingLocation.current = false;
        toast({
          title: "Location Found",
          description: "Showing restaurants within 700 meters of your location",
        });
      },
      (error) => {
        isRequestingLocation.current = false;
        let errorMessage = "Unable to retrieve your location";
        
        // Provide more specific error messages
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access was denied. Please enable location permissions in your browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get your location timed out.";
            break;
        }
        
        setLocationError(errorMessage);
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 0 // don't use cached position
      }
    );
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    // If "Near Me" filter was just turned on, get the user's location
    if (newFilters.nearMe && !filters.nearMe) {
      getUserLocation();
    }
    
    setFilters(newFilters);
  };
  
  // Get unique cuisines from restaurants
  const availableCuisines = restaurants 
    ? restaurants
        .map(r => r.cuisine)
        .filter((cuisine, index, self) => self.indexOf(cuisine) === index)
    : [];
  
  // Apply filters to restaurants
  const applyFilters = (restaurants: Restaurant[] | undefined) => {
    if (!restaurants) return [];
    
    return restaurants.filter(restaurant => {
      // Apply wait time filter
      if (filters.waitTime && restaurant.currentWaitStatus !== filters.waitTime) {
        return false;
      }
      
      // Apply cuisine filter
      if (filters.cuisine && restaurant.cuisine !== filters.cuisine) {
        return false;
      }
      
      // Apply search query filter
      if (searchQuery && !(
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.address.toLowerCase().includes(searchQuery.toLowerCase())
      )) {
        return false;
      }
      
      // Apply Near Me filter - show restaurants within 700 meters (0.7 km)
      if (filters.nearMe && userLocation) {
        try {
          const restaurantLat = parseFloat(restaurant.latitude);
          const restaurantLng = parseFloat(restaurant.longitude);
          
          // Check for valid coordinates
          if (isNaN(restaurantLat) || isNaN(restaurantLng)) {
            console.warn(`Invalid coordinates for restaurant ${restaurant.name}`);
            return false;
          }
          
          // Calculate distance between user and restaurant
          const distance = calculateDistance(
            userLocation.lat, 
            userLocation.lng, 
            restaurantLat, 
            restaurantLng
          );
          
          // Only show restaurants within 0.7 km (700 meters)
          if (distance > 0.7) {
            return false;
          }
          
          // Add distance info to restaurant for display purposes
          (restaurant as any).distance = distance;
        } catch (error) {
          console.error("Error calculating distance:", error);
          return false;
        }
      }
      
      return true;
    });
  };
  
  // Filter restaurants based on all criteria
  const filteredRestaurants = applyFilters(restaurants);
  
  // Get a featured restaurant (in this case, using the one with the highest rating)
  const featuredRestaurant = restaurants?.sort((a, b) => 
    parseFloat(b.rating || "0") - parseFloat(a.rating || "0")
  )[0];
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-md">
        Error loading restaurants: {(error as Error).message}
      </div>
    );
  }
  
  return (
    <section>
      <div className="mb-8">
        <h2 className="text-3xl font-bold font-heading mb-2">Find available restaurants near you</h2>
        <p className="text-gray-600 max-w-3xl">See real-time wait times before you arrive. Skip the line and plan your dining experience efficiently.</p>
      </div>

      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} />

      {/* Filters */}
      <RestaurantFilters 
        onFilterChange={handleFilterChange} 
        availableCuisines={availableCuisines} 
      />

      {/* Restaurant Listings */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
              <div className="w-full h-48 bg-gray-300"></div>
              <div className="p-4">
                <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredRestaurants && filteredRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredRestaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-lg text-gray-500">No restaurants found matching your search criteria.</p>
        </div>
      )}

      {/* Featured Restaurant Section */}
      {featuredRestaurant && <FeaturedRestaurant restaurant={featuredRestaurant} />}
    </section>
  );
};

export default CustomerView;
