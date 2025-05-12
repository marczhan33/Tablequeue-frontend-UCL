import { useEffect, useRef } from 'react';

// Type definition for Google Maps API
declare global {
  interface Window {
    google: any;
    initMap: () => void;
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

const GoogleMap = ({ 
  latitude, 
  longitude, 
  zoom = 15, 
  markerTitle = 'Restaurant Location',
  height = '250px',
  className = ''
}: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  
  // Function to initialize the map
  useEffect(() => {
    // Skip if no API key or proper coordinates
    if (!mapRef.current || !latitude || !longitude) return;
    
    // Create a mock map display if API key is not available
    if (!apiKey) {
      const mockMap = document.createElement('div');
      mockMap.style.width = '100%';
      mockMap.style.height = '100%';
      mockMap.style.backgroundColor = '#eee';
      mockMap.style.display = 'flex';
      mockMap.style.alignItems = 'center';
      mockMap.style.justifyContent = 'center';
      mockMap.style.color = '#666';
      mockMap.style.fontWeight = 'medium';
      mockMap.innerHTML = '<span>Google Maps would display here with an API key</span>';
      
      if (mapRef.current) {
        mapRef.current.innerHTML = '';
        mapRef.current.appendChild(mockMap);
      }
      return;
    }
    
    // If the Google Maps script is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }
    
    // If the script hasn't been loaded, add it to the page
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    
    window.initMap = initializeMap;
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup if component unmounts before script loads
      window.initMap = () => {};
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [latitude, longitude, zoom, markerTitle, apiKey]);
  
  // Function to initialize map with coordinates
  const initializeMap = () => {
    if (!mapRef.current) return;
    
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
    new window.google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: markerTitle,
    });
  };
  
  return (
    <div 
      ref={mapRef} 
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ height: height }}
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
