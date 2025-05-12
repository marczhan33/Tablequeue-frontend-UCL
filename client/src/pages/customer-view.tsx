import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Restaurant } from "@shared/schema";
import SearchBar from "@/components/search-bar";
import RestaurantCard from "@/components/restaurant-card";
import FeaturedRestaurant from "@/components/featured-restaurant";
import { useToast } from "@/hooks/use-toast";

const CustomerView = () => {
  const [searchQuery, setSearchQuery] = useState("");
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
  
  // Filter restaurants based on search query
  const filteredRestaurants = searchQuery 
    ? restaurants?.filter(restaurant => 
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : restaurants;
  
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
      <div className="mb-8 flex flex-wrap gap-2">
        <button className="bg-white border border-gray-300 rounded-full px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          Filters
        </button>
        <button className="bg-white border border-gray-300 rounded-full px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          Wait Time
        </button>
        <button className="bg-white border border-gray-300 rounded-full px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
          Cuisine
        </button>
        <button className="bg-white border border-gray-300 rounded-full px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          Near Me
        </button>
      </div>

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
