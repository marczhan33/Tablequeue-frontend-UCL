import { type Restaurant, type WaitStatus } from "@shared/schema";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import WaitTimeBadge from "./wait-time-badge";
import GoogleMap from "./ui/google-map";

interface LocationWaitTimeProps {
  restaurant: Restaurant;
  partySize?: number;
}

const LocationWaitTime = ({ restaurant, partySize = 2 }: LocationWaitTimeProps) => {
  // Fetch real-time wait prediction
  const { data: capacityData } = useQuery({
    queryKey: [`/api/restaurants/${restaurant.id}/capacity-prediction`, partySize],
    queryFn: () => fetch(`/api/restaurants/${restaurant.id}/capacity-prediction?partySize=${partySize}`)
      .then(res => res.json()),
    enabled: !!restaurant.id && partySize > 0,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Set wait time data for Google Maps using real-time data
  useEffect(() => {
    // Initialize or update the global waitTimeData object
    if (!window.waitTimeData) {
      window.waitTimeData = {};
    }
    
    // Use real-time wait data if available, otherwise fall back to old system
    const waitTime = capacityData?.estimatedWaitTime ?? 0;
    window.waitTimeData[restaurant.name] = {
      status: getWaitStatusFromMinutes(waitTime),
      minutes: waitTime > 0 ? waitTime : undefined
    };
    
    // Cleanup when component unmounts
    return () => {
      if (window.waitTimeData) {
        delete window.waitTimeData[restaurant.name];
      }
    };
  }, [restaurant.name, capacityData]);

  // Convert minutes to wait status for backwards compatibility
  const getWaitStatusFromMinutes = (minutes: number): WaitStatus => {
    if (minutes === 0) return 'available';
    if (minutes <= 15) return 'short';
    if (minutes <= 45) return 'long';
    return 'very_long';
  };

  // Get formatted wait time text using real-time data
  const getWaitTimeText = () => {
    const waitTime = capacityData?.estimatedWaitTime ?? 0;
    
    if (waitTime === 0) {
      return 'Available now - no wait time';
    }
    
    return `Approximately ${waitTime} minutes wait`;
  };

  // Get corresponding color class based on real-time wait time
  const getStatusColorClass = (): string => {
    const waitTime = capacityData?.estimatedWaitTime ?? 0;
    
    if (waitTime === 0) return 'text-green-600';
    if (waitTime <= 15) return 'text-green-600';
    if (waitTime <= 45) return 'text-orange-600';
    return 'text-red-600';
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="p-5">
          <h3 className="font-semibold text-lg mb-3">Current Wait Time</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-8 w-8 mr-3 ${getStatusColorClass()}`} 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span className="text-xl font-semibold">{getWaitTimeText()}</span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Last updated: {new Date().toLocaleTimeString()} • Real-time wait prediction for party of {partySize}
            </p>


          </div>

          <div className="mt-5">
            <h3 className="font-semibold text-lg mb-3">Restaurant Details</h3>
            <div className="space-y-3">
              <div className="flex">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <button 
                  className="text-left hover:text-primary flex items-center group"
                  onClick={() => {
                    navigator.clipboard.writeText(restaurant.address);
                    alert("Address copied to clipboard");
                  }}
                >
                  <span>{restaurant.address}</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
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
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                        .filter(day => (restaurant.operatingHours as any)?.[day])
                        .map((day) => (
                        <div key={day}>
                          <span className="font-medium">{day.charAt(0).toUpperCase() + day.slice(1)}: </span>
                          <span>{(restaurant.operatingHours as any)[day].open} - {(restaurant.operatingHours as any)[day].close}</span>
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
          
          <div className="text-red-600 text-sm text-center mt-3">
            Wait times in Google Maps are updated in real-time by the restaurant
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