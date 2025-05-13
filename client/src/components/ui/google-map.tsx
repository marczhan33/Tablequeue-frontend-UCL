import React, { useEffect, useRef, useState } from 'react';

// Type definition for Google Maps API
declare global {
  interface Window {
    google: any;
    initMap: () => void;
    waitTimeData?: Record<string, {
      status: 'available' | 'short' | 'long' | 'very_long' | 'closed';
      minutes?: number;
    }>;
  }
}

interface GoogleMapProps {
  latitude: string;
  longitude: string;
  zoom?: number;
  markerTitle?: string;
  height?: string;
  className?: string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ 
  latitude, 
  longitude, 
  zoom = 15, 
  markerTitle = 'Restaurant Location',
  height = '250px',
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [useFallbackMap, setUseFallbackMap] = useState(!apiKey);
  
  // Open the actual location in Google Maps when clicked
  const openInGoogleMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank');
  };
  
  // Function to initialize map with coordinates
  const initializeMap = () => {
    if (!mapRef.current) return;
    
    try {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      // Create the map
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom: zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      
      // Add marker for restaurant location
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: markerTitle,
      });
  
      // Add info window with wait time information
      const waitTimeInfo = window.waitTimeData ? window.waitTimeData[markerTitle] : null;
      const waitTimeContent = waitTimeInfo
        ? `<div style="font-family: Arial, sans-serif; padding: 5px;">
             <div><strong>${markerTitle}</strong></div>
             <div style="display: flex; align-items: center; margin-top: 8px;">
               <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${
                 waitTimeInfo.status === 'available' ? '#4CAF50' : 
                 waitTimeInfo.status === 'short' ? '#FF9800' : 
                 waitTimeInfo.status === 'long' ? '#F44336' :
                 waitTimeInfo.status === 'very_long' ? '#9C27B0' : '#757575'
               }; margin-right: 6px;"></span>
               <span style="font-size: 0.9em;">${
                 waitTimeInfo.status === 'available' ? 'No wait' : 
                 waitTimeInfo.status === 'short' ? 'Short wait (15-30 min)' : 
                 waitTimeInfo.status === 'long' ? 'Long wait (30-60 min)' :
                 waitTimeInfo.status === 'very_long' ? 'Very long wait (60+ min)' : 'Closed'
               }</span>
             </div>
             ${waitTimeInfo.minutes ? `<div style="margin-top: 4px; font-size: 0.85em; color: #555;">Approx. ${waitTimeInfo.minutes} minutes</div>` : ''}
           </div>`
        : `<div style="font-family: Arial, sans-serif; padding: 5px;"><strong>${markerTitle}</strong></div>`;
      
      const infoWindow = new window.google.maps.InfoWindow({
        content: waitTimeContent
      });
  
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    } catch (error) {
      console.error('Error initializing Google Map:', error);
      setUseFallbackMap(true);
    }
  };
  
  // Function to load the map script
  useEffect(() => {
    // Skip if no proper coordinates or already using fallback
    if (!mapRef.current || !latitude || !longitude || useFallbackMap) return;
    
    // Check if we have a valid API key
    if (!apiKey) {
      console.warn('Google Maps API key is missing. Using fallback map interface.');
      setUseFallbackMap(true);
      return;
    }
    
    // Handle map loading errors
    const handleMapError = () => {
      console.warn('Google Maps failed to load. Using fallback interface.');
      setUseFallbackMap(true);
      
      // Also clear the map container to remove error messages
      if (mapRef.current) {
        mapRef.current.innerHTML = '';
      }
    };
    
    // Listen for error messages in the console
    const originalConsoleError = console.error;
    console.error = function(...args) {
      // Check if this is a Google Maps API error
      if (args.length > 0 && typeof args[0] === 'string' && 
          (args[0].includes('Google Maps JavaScript API error') || 
           args[0].includes('InvalidKeyMapError'))) {
        handleMapError();
      }
      originalConsoleError.apply(console, args);
    };
    
    // If the Google Maps script is already loaded
    if (window.google && window.google.maps) {
      try {
        initializeMap();
      } catch (error) {
        handleMapError();
      }
      return;
    }
    
    // If the script hasn't been loaded, add it to the page
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = handleMapError;
    
    // Set up a shorter timeout for better user experience
    const timeoutId = setTimeout(handleMapError, 3000);
    
    // Also set up a mutation observer to watch for error messages in the map container
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mapRef.current) {
          // Check if the error message is added to the DOM
          if (mapRef.current.textContent?.includes('Oops! Something went wrong')) {
            handleMapError();
            observer.disconnect();
          }
        }
      }
    });
    
    if (mapRef.current) {
      observer.observe(mapRef.current, { childList: true, subtree: true });
    }
    
    // Define the callback for when the script loads
    window.initMap = () => {
      clearTimeout(timeoutId);
      try {
        initializeMap();
      } catch (error) {
        handleMapError();
      }
    };
    
    document.head.appendChild(script);
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      window.initMap = () => {};
      console.error = originalConsoleError;
      observer.disconnect();
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [latitude, longitude, zoom, markerTitle, apiKey, useFallbackMap]);
  
  // Render the fallback map interface
  if (useFallbackMap) {
    return (
      <div 
        className={`rounded-lg overflow-hidden ${className} cursor-pointer`}
        style={{ height }}
        aria-label="Map showing restaurant location"
        onClick={openInGoogleMaps}
      >
        <div className="h-full bg-gray-100 flex flex-col items-center justify-center p-4 relative">
          {/* Grid background */}
          <div className="absolute inset-0 bg-blue-50 opacity-50 pointer-events-none">
            <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          </div>
          
          {/* Location pin */}
          <div className="z-10 bg-primary text-white rounded-full p-4 mb-2 shadow-lg">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
          
          {/* Address info */}
          <div className="z-10 text-center bg-white rounded-lg p-2 shadow-md max-w-xs">
            <h4 className="font-semibold mb-1">{markerTitle}</h4>
            <p className="text-sm text-gray-500">
              Lat: {parseFloat(latitude).toFixed(4)}, Lng: {parseFloat(longitude).toFixed(4)}
            </p>
            <p className="text-xs text-primary mt-1 font-medium">Click to open in Google Maps</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render the Google Maps container
  return (
    <div 
      ref={mapRef} 
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ height }}
      aria-label="Google Map showing restaurant location"
    >
      <div className="h-full bg-gray-200 flex items-center justify-center">
        <span className="text-gray-500">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 inline mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
            />
          </svg>
          Loading map...
        </span>
      </div>
    </div>
  );
};

export default GoogleMap;
