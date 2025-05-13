import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Creates a Google Maps URL for directions to a specific location
 * @param name Name of the location
 * @param address Address of the location
 * @param latitude Latitude coordinate (optional)
 * @param longitude Longitude coordinate (optional)
 * @returns Google Maps URL
 */
export function createGoogleMapsUrl(
  name: string, 
  address: string, 
  latitude?: string, 
  longitude?: string
): string {
  // First try using coordinates if available
  if (latitude && longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }
  
  // Fall back to address search
  const searchQuery = encodeURIComponent(`${name}, ${address}`);
  return `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
}
