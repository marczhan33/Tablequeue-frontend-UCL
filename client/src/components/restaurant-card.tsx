import { type Restaurant } from "@shared/schema";
import WaitTimeBadge from "@/components/wait-time-badge";

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard = ({ restaurant }: RestaurantCardProps) => {
  // Format price range to display correct number of $ symbols
  const getPriceRangeSymbols = (priceRange: string) => priceRange;
  
  // Format distance (in a real app, would calculate based on user location)
  const getFormattedDistance = (restaurant: Restaurant) => {
    // This would be calculated based on user's location
    // For demo purposes, return a random distance
    return `${(Math.random() * 2).toFixed(1)} miles away`;
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
      <img 
        src={getImageUrl(restaurant.cuisine, restaurant.id)} 
        alt={`${restaurant.name} interior`} 
        className="w-full h-48 object-cover" 
      />
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-heading font-bold text-xl">{restaurant.name}</h3>
          <WaitTimeBadge status={restaurant.currentWaitStatus as any} />
        </div>
        <p className="text-gray-600 text-sm mb-3">
          {restaurant.cuisine} • {getPriceRangeSymbols(restaurant.priceRange)} • {getFormattedDistance(restaurant)}
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
          <button 
            className="text-secondary hover:text-primary transition-colors duration-200"
            onClick={() => {
              // In a real app, would open directions in Google Maps
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
            Directions
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
