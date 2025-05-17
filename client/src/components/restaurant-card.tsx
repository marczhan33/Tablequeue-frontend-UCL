import { type Restaurant } from "@shared/schema";
import { Link } from "wouter";
import WaitTimeBadge from "@/components/wait-time-badge";

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard = ({ restaurant }: RestaurantCardProps) => {
  // Format price range to display correct number of $ symbols
  const getPriceRangeSymbols = (priceRange: string) => priceRange;
  
  // Format distance based on calculated distance (when available)
  const getFormattedDistance = (restaurant: Restaurant) => {
    // Check if distance property has been added by the "Near Me" filter
    const distance = (restaurant as any).distance;
    
    if (typeof distance === 'number') {
      // Convert kilometers to meters for distances less than 1km
      if (distance < 1) {
        return `${Math.round(distance * 1000)} meters away`;
      }
      // Otherwise show in kilometers with 1 decimal place
      return `${distance.toFixed(1)} km away`;
    }
    
    // If no distance available, don't show distance
    return "";
  };
  
  // Get formatted wait time text
  const getWaitTimeText = (restaurant: Restaurant) => {
    switch (restaurant.currentWaitStatus) {
      case 'available':
        return 'No wait';
      case 'short':
        return `${restaurant.customWaitTime || 15}-${(restaurant.customWaitTime || 15) + 10} minutes`;
      case 'long':
        return `${restaurant.customWaitTime || 30}-${(restaurant.customWaitTime || 30) + 15} minutes`;
      default:
        return 'Unknown';
    }
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
  
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      <Link href={`/restaurant/${restaurant.id}`}>
        <img 
          src={getImageUrl(restaurant.cuisine, restaurant.id)} 
          alt={`${restaurant.name} interior`} 
          className="w-full h-48 object-cover cursor-pointer" 
        />
      </Link>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/restaurant/${restaurant.id}`}>
            <h3 className="font-heading font-bold text-xl cursor-pointer hover:text-primary transition-colors">{restaurant.name}</h3>
          </Link>
          <WaitTimeBadge status={restaurant.currentWaitStatus as any} />
        </div>
        <p className="text-gray-600 text-sm mb-3">
          {restaurant.cuisine} • {getPriceRangeSymbols(restaurant.priceRange)} 
          {getFormattedDistance(restaurant) && ` • ${getFormattedDistance(restaurant)}`}
        </p>
        <div className="flex items-center text-sm text-gray-500 mb-4">
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
          <span>{restaurant.rating} ({restaurant.reviewCount} reviews)</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sm">
            <span className="font-semibold">Wait time:</span> {getWaitTimeText(restaurant)}
          </div>
          
          <div className="flex space-x-2">
            <Link href={`/restaurant/${restaurant.id}`}>
              <div className="text-secondary hover:text-primary transition-colors duration-200 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                Details
              </div>
            </Link>

            <button 
              className="text-secondary hover:text-primary transition-colors duration-200"
              onClick={() => {
                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`, '_blank');
              }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-5 h-5 inline mr-1"
              >
                <path 
                  fillRule="evenodd" 
                  d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" 
                  clipRule="evenodd" 
                />
              </svg>
              Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
