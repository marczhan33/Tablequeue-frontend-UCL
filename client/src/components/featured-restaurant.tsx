import { type Restaurant } from "@shared/schema";
import WaitTimeBadge from "@/components/wait-time-badge";

interface FeaturedRestaurantProps {
  restaurant: Restaurant;
  partySize: number;
}

const FeaturedRestaurant = ({ restaurant, partySize }: FeaturedRestaurantProps) => {
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
  
  // Calculate the progress percentage for the wait time indicator
  const getWaitTimePercentage = (status: string) => {
    switch (status) {
      case 'available':
        return 0;
      case 'short':
        return 35;
      case 'long':
        return 75;
      default:
        return 0;
    }
  };
  
  // Mock image URL for demo - in production would use real images
  const getImageUrl = (id: number) => {
    return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500';
  };
  
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold font-heading mb-6">Featured Restaurant</h2>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:flex-shrink-0 md:w-1/2">
            <img 
              src={getImageUrl(restaurant.id)} 
              alt={`${restaurant.name} interior`} 
              className="h-full w-full object-cover" 
            />
          </div>
          <div className="p-6 md:w-1/2">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-heading font-bold text-2xl mb-1">{restaurant.name}</h3>
                <p className="text-gray-600">{restaurant.cuisine} • {restaurant.priceRange} • Downtown</p>
              </div>
              <WaitTimeBadge status={restaurant.currentWaitStatus as any} />
            </div>
            
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
            
            <p className="text-gray-600 mb-6">{restaurant.description}</p>
            
            <div className="mb-4">
              <div className="text-sm mb-1">
                <span className="font-semibold">Current wait time:</span> {getWaitTimeText(restaurant)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${restaurant.currentWaitStatus === 'available' ? 'bg-status-available' : restaurant.currentWaitStatus === 'short' ? 'bg-status-short' : 'bg-status-long'}`} 
                  style={{width: `${getWaitTimePercentage(restaurant.currentWaitStatus)}%`}}
                ></div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {restaurant.features?.map((feature, index) => (
                <span key={index} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {feature}
                </span>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button 
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors duration-200 font-medium shadow-sm flex items-center gap-2"
                onClick={() => {
                  // In a real app, would open directions in Google Maps
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`, '_blank');
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Get Directions
              </button>
              <button className="bg-white border border-secondary text-secondary px-4 py-2 rounded-lg hover:bg-secondary hover:text-white transition-colors duration-200 font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                More Info
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedRestaurant;
