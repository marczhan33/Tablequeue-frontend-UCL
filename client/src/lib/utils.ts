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
  // Use a super-simple maps.google.com URL that works more reliably in restricted environments
  const query = encodeURIComponent(`${name}, ${address}`);
  return `https://maps.google.com?q=${query}`;
}
