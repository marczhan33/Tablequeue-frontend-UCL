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
    // Get wait time color based on restaurant name - this helps simulate the actual map experience
    let statusColor = '#4CAF50'; // default available color
    
    if (window.waitTimeData && window.waitTimeData[markerTitle]) {
      const waitStatus = window.waitTimeData[markerTitle].status;
      statusColor = waitStatus === 'available' ? '#4CAF50' : 
                   waitStatus === 'short' ? '#FF9800' : 
                   waitStatus === 'long' ? '#F44336' :
                   waitStatus === 'very_long' ? '#9C27B0' : '#757575';
    }
    
    return (
      <div 
        className={`rounded-lg overflow-hidden ${className} cursor-pointer`}
        style={{ height }}
        aria-label="Map showing restaurant location"
        onClick={openInGoogleMaps}
      >
        <div className="h-full bg-gray-100 flex flex-col items-center justify-center p-4 relative">
          {/* Grid background with roads simulation */}
          <div className="absolute inset-0 bg-blue-50 opacity-50 pointer-events-none">
            <div className="w-full h-full" 
                 style={{ 
                  backgroundImage: `
                    linear-gradient(to right, #e5e7eb 1px, transparent 1px), 
                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px),
                    linear-gradient(to right, rgba(59, 130, 246, 0.3) 3px, transparent 3px),
                    linear-gradient(to bottom, rgba(59, 130, 246, 0.3) 3px, transparent 3px)
                  `, 
                  backgroundSize: '20px 20px, 20px 20px, 100px 100px, 100px 100px'
                 }}
            ></div>
          </div>
          
          {/* Location pin with animation */}
          <div className="z-10 flex flex-col items-center">
            <div 
              className="relative shadow-lg" 
              style={{ animation: 'bounce 2s infinite' }}
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: statusColor }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-8 w-8 text-white" 
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
              <div 
                className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-3 rounded-full bg-black opacity-20"
                style={{ animation: 'pulse 2s infinite' }}
              ></div>
            </div>
          </div>
          
          {/* Address info */}
          <div className="z-10 text-center bg-white rounded-lg p-3 shadow-md max-w-xs mt-4 border border-gray-200">
            <h4 className="font-semibold mb-1 text-lg">{markerTitle}</h4>
            <div className="flex items-center justify-center mb-1">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: statusColor }}
              ></div>
              <p className="text-sm">
                {window.waitTimeData && window.waitTimeData[markerTitle]?.status === 'available' ? 'No wait' : 
                 window.waitTimeData && window.waitTimeData[markerTitle]?.status === 'short' ? 'Short wait' : 
                 window.waitTimeData && window.waitTimeData[markerTitle]?.status === 'long' ? 'Long wait' :
                 window.waitTimeData && window.waitTimeData[markerTitle]?.status === 'very_long' ? 'Very long wait' : 
                 window.waitTimeData && window.waitTimeData[markerTitle]?.status === 'closed' ? 'Closed' : 'Status unavailable'}
              </p>
            </div>
            <p className="text-sm text-gray-500 border-t border-gray-100 pt-2 mt-1">
              Location: {parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}
            </p>
            <p className="text-xs text-primary mt-2 font-medium flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
              </svg>
              Open in Google Maps
            </p>
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
