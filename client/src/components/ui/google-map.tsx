import React from 'react';

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
  markerTitle = 'Restaurant Location',
  height = '250px',
  className = ''
}: GoogleMapProps) => {

  // Open the actual location in Google Maps when clicked
  const openInGoogleMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank');
  };
  
  return (
    <div 
      className={`rounded-lg overflow-hidden ${className} cursor-pointer`}
      style={{ height }}
      aria-label="Map showing restaurant location"
      onClick={openInGoogleMaps}
    >
      <div className="h-full bg-gray-100 flex flex-col items-center justify-center p-4 relative">
        {/* Interactive map-like appearance */}
        <div className="absolute inset-0 bg-blue-50 opacity-50 pointer-events-none">
          {/* Grid lines to simulate a map */}
          <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        </div>
        
        {/* Location pin in the center */}
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
};

export default GoogleMap;
