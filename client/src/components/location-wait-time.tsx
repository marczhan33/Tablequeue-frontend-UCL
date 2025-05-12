import { type Restaurant, type WaitStatus } from "@shared/schema";
import WaitTimeBadge from "./wait-time-badge";
import GoogleMap from "./ui/google-map";

interface LocationWaitTimeProps {
  restaurant: Restaurant;
}

const LocationWaitTime = ({ restaurant }: LocationWaitTimeProps) => {
  // Get formatted wait time text
  const getWaitTimeText = (restaurant: Restaurant) => {
    switch (restaurant.currentWaitStatus) {
      case 'available':
        return 'Available now - no wait time';
      case 'short':
        return `${restaurant.customWaitTime || 15}-${(restaurant.customWaitTime || 15) + 10} minutes wait`;
      case 'long':
        return `${restaurant.customWaitTime || 30}-${(restaurant.customWaitTime || 30) + 15} minutes wait`;
      default:
        return 'Wait time unavailable';
    }
  };

  // Get corresponding color class based on status
  const getStatusColorClass = (status: WaitStatus): string => {
    switch (status) {
      case 'available':
        return 'text-status-available';
      case 'short':
        return 'text-status-short';
      case 'long':
        return 'text-status-long';
      default:
        return 'text-gray-500';
    }
  };

  // Generate directions URL for Google Maps
  const getDirectionsUrl = (restaurant: Restaurant): string => {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.address)}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-5 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold font-heading">{restaurant.name}</h2>
            <p className="text-gray-600 text-sm">{restaurant.cuisine} • {restaurant.priceRange}</p>
          </div>
          <WaitTimeBadge 
            status={restaurant.currentWaitStatus as WaitStatus} 
            size="lg" 
            className="mt-2 md:mt-0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="p-5">
          <h3 className="font-semibold text-lg mb-3">Current Wait Time</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-8 w-8 mr-3 ${getStatusColorClass(restaurant.currentWaitStatus as WaitStatus)}`} 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span className="text-xl font-semibold">{getWaitTimeText(restaurant)}</span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Last updated: {new Date().toLocaleTimeString()} • This information is provided by the restaurant
            </p>

            <div className="bg-gray-100 p-3 rounded-lg border-l-4 border-secondary text-sm">
              <p>
                <span className="font-semibold">Tip:</span> Save this location in Google Maps to check wait times before your visit.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <h3 className="font-semibold text-lg mb-3">Restaurant Details</h3>
            <div className="space-y-3">
              <div className="flex">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span>{restaurant.address}</span>
              </div>
              
              <div className="flex">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span>{restaurant.phoneNumber || 'No phone number available'}</span>
              </div>
              
              <div className="flex">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold">Operating Hours:</p>
                  {restaurant.operatingHours ? (
                    <div className="text-sm grid grid-cols-2 gap-2 mt-1">
                      {Object.entries(restaurant.operatingHours as Record<string, {open: string, close: string}>).map(([day, hours]) => (
                        <div key={day}>
                          <span className="font-medium">{day.charAt(0).toUpperCase() + day.slice(1)}: </span>
                          <span>{hours.open} - {hours.close}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span>Hours not available</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-5">
          <h3 className="font-semibold text-lg mb-3">Location</h3>
          <GoogleMap
            latitude={restaurant.latitude}
            longitude={restaurant.longitude}
            markerTitle={restaurant.name}
            height="300px"
            className="mb-4"
          />
          
          <div className="grid grid-cols-2 gap-3">
            <a 
              href={getDirectionsUrl(restaurant)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-white px-4 py-3 rounded-lg font-medium text-center flex items-center justify-center gap-2 hover:bg-opacity-90 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
              </svg>
              Get Directions
            </a>
            <a 
              href={`tel:${restaurant.phoneNumber}`}
              className="bg-white border border-secondary text-secondary px-4 py-3 rounded-lg font-medium text-center flex items-center justify-center gap-2 hover:bg-secondary hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Call Restaurant
            </a>
          </div>
          
          <div className="mt-4">
            <h3 className="font-semibold text-lg mb-3">Features</h3>
            <div className="flex flex-wrap gap-2">
              {restaurant.features?.map((feature, index) => (
                <span key={index} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded">
                  {feature}
                </span>
              ))}
              {(!restaurant.features || restaurant.features.length === 0) && (
                <span className="text-gray-500">No features listed</span>
              )}
            </div>
          </div>
          
          {restaurant.description && (
            <div className="mt-4">
              <h3 className="font-semibold text-lg mb-2">About</h3>
              <p className="text-gray-600">{restaurant.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationWaitTime;