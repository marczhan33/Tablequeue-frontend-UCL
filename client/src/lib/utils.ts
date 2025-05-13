import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Creates a Google Maps URL for directions to a specific location
 * @param name Name of the location
 * @param address Address of the location
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Google Maps URL that works on both mobile and desktop
 */
export function createGoogleMapsUrl(
  name: string, 
  address: string, 
  latitude: string, 
  longitude: string
): string {
  // Create location-based query (works well on desktop)
  const locationQuery = encodeURIComponent(`${name}, ${address}`);
  const mapsLocationUrl = `https://www.google.com/maps/search/?api=1&query=${locationQuery}`;
  
  // Create directions API URL (works well on mobile)
  const directionsUrl = `https://maps.google.com/?daddr=${latitude},${longitude}`;
  
  // Try to detect if user is on mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Return appropriate URL based on device
  return isMobile ? directionsUrl : mapsLocationUrl;
}
