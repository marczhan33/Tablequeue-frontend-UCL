import { type Restaurant } from "@shared/schema";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";

interface RestaurantCardProps {
  restaurant: Restaurant;
  partySize: number;
}

const RestaurantCard = ({ restaurant, partySize }: RestaurantCardProps) => {
  // Fetch real-time wait prediction
  const { data: capacityData } = useQuery({
    queryKey: [`/api/restaurants/${restaurant.id}/capacity-prediction`, partySize],
    queryFn: () => fetch(`/api/restaurants/${restaurant.id}/capacity-prediction?partySize=${partySize}`)
      .then(res => res.json()),
    enabled: !!restaurant.id && partySize > 0,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Format price range to display correct number of $ symbols
  const getPriceRangeSymbols = (priceRange: string) => priceRange;
  
  // Format distance based on calculated distance (when available)
  const getFormattedDistance = (restaurant: Restaurant) => {
    const distance = (restaurant as any).distance;
    
    if (typeof distance === 'number') {
      if (distance < 1) {
        return `${Math.round(distance * 1000)}m away`;
      }
      return `${distance.toFixed(1)}km away`;
    }
    return "";
  };
  
  // Get wait time and color coding
  const getWaitTimeDisplay = () => {
    const waitTime = capacityData?.estimatedWaitTime ?? 0;
    
    // Color coding: Green (0-15min), Yellow/Orange (15-45min), Red (45+ min)
    let colorClass = "";
    let displayText = "";
    
    if (waitTime === 0) {
      colorClass = "text-green-600 bg-green-50";
      displayText = "Available";
    } else if (waitTime <= 15) {
      colorClass = "text-green-600 bg-green-50";  
      displayText = `${waitTime} MIN`;
    } else if (waitTime <= 45) {
      colorClass = "text-orange-600 bg-orange-50";
      displayText = `${waitTime} MIN`;
    } else {
      colorClass = "text-red-600 bg-red-50";
      displayText = `${waitTime} MIN`;
    }
    
    return { colorClass, displayText };
  };
  
  // Mock image URL for demo - in production would use real images 
  const getImageUrl = (cuisine: string, id: number) => {
    // These would be real images in production
    const images = [
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500'
    ];
    
    return images[id % images.length];
  };
  
  const { colorClass, displayText } = getWaitTimeDisplay();

  return (
    <Link href={`/restaurant/${restaurant.id}`}>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer">
        <div className="relative">
          <img 
            src={getImageUrl(restaurant.cuisine, restaurant.id)} 
            alt={`${restaurant.name} interior`} 
            className="w-full h-48 object-cover" 
          />
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-semibold ${colorClass}`}>
            {displayText}
          </div>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-xl text-gray-900 leading-tight">{restaurant.name}</h3>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <span className="text-green-600 font-medium">{restaurant.cuisine}</span>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {getFormattedDistance(restaurant) && (
                <span>{getFormattedDistance(restaurant)}</span>
              )}
            </div>
          </div>
          
          <p className="text-gray-500 text-sm mb-3">{restaurant.address}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-500">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-4 h-4 text-yellow-400 mr-1"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span>{restaurant.rating}</span>
              <span className="ml-1">({restaurant.reviewCount})</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              <span>{getPriceRangeSymbols(restaurant.priceRange)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
