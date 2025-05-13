import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Restaurant, WaitStatus } from "@shared/schema";
import SearchBar from "@/components/search-bar";
import RestaurantCard from "@/components/restaurant-card";
import FeaturedRestaurant from "@/components/featured-restaurant";
import { useToast } from "@/hooks/use-toast";
import { RestaurantFilters, FilterState } from "@/components/restaurant-filters";

const CustomerView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    waitTime: null,
    cuisine: null,
    nearMe: false
  });
  const { toast } = useToast();
  
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
  
  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
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
      
      // Near Me filter would require user's location - for now, just passing through
      // In a real implementation, we would get user's location and filter by distance
      
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
