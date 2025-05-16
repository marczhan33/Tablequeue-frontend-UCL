import { config } from "dotenv";
config();

import fetch from "node-fetch";
import { Restaurant } from "@shared/schema";

const GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;
const BASE_URL = "https://maps.googleapis.com/maps/api/place";

interface PlaceDetailsResponse {
  result: {
    place_id: string;
    name: string;
    current_opening_hours?: {
      open_now: boolean;
      periods: any[];
    };
    // Other place details
  };
  status: string;
}

/**
 * Find a place by name and address using Google Maps API
 * @param restaurant Restaurant data
 * @returns Google Place ID if found, null otherwise
 */
export async function findPlaceId(restaurant: Restaurant): Promise<string | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error("Google Maps API key is missing");
    return null;
  }

  try {
    // Format the query based on restaurant name and address
    const query = encodeURIComponent(`${restaurant.name} ${restaurant.address}`);
    const url = `${BASE_URL}/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id,name,formatted_address&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json() as any;
    
    if (data.status === "OK" && data.candidates && data.candidates.length > 0) {
      return data.candidates[0].place_id;
    } else {
      console.log(`No place found for restaurant: ${restaurant.name}`);
      return null;
    }
  } catch (error) {
    console.error("Error finding place:", error);
    return null;
  }
}

/**
 * Get Place details from Google Maps API
 * @param placeId Google Place ID
 * @returns Place details
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetailsResponse | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error("Google Maps API key is missing");
    return null;
  }

  try {
    const url = `${BASE_URL}/details/json?place_id=${placeId}&fields=name,place_id,current_opening_hours&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json() as PlaceDetailsResponse;
    
    if (data.status === "OK") {
      return data;
    } else {
      console.error(`Failed to get place details: ${data.status}`);
      return null;
    }
  } catch (error) {
    console.error("Error getting place details:", error);
    return null;
  }
}

// Wait time in minutes based on restaurant wait status
const waitTimeMapping: Record<string, number> = {
  'available': 0,
  'short': 15,
  'long': 45,
  'very_long': 90,
  'closed': -1 // Special case for closed
};

/**
 * Update wait time on Google Maps
 * @param restaurant Restaurant data
 * @returns Success status
 */
export async function updateGoogleMapsWaitTime(
  restaurant: Restaurant
): Promise<boolean> {
  // This is a placeholder for the actual Google Maps API integration
  // Google doesn't currently have a public API for updating wait times directly
  // In a real implementation, this would likely be done through a business integration
  
  try {
    const placeId = await findPlaceId(restaurant);
    if (!placeId) {
      return false;
    }
    
    // Calculate wait time in minutes
    let waitTimeMinutes = waitTimeMapping[restaurant.currentWaitStatus] || 0;
    
    // If the restaurant has a custom wait time, use that instead
    if (restaurant.customWaitTime && restaurant.customWaitTime > 0) {
      waitTimeMinutes = restaurant.customWaitTime;
    }
    
    console.log(`[Google Maps] Updated wait time for ${restaurant.name} to ${waitTimeMinutes} minutes`);
    
    // In a real implementation, this would make an API call to update the wait time
    // For now, we'll just log it for demonstration purposes
    return true;
  } catch (error) {
    console.error("Error updating Google Maps wait time:", error);
    return false;
  }
}

/**
 * Generate deep link to Google Maps with restaurant information
 * @param restaurant Restaurant data
 * @returns Google Maps URL with restaurant info
 */
export function generateGoogleMapsUrl(restaurant: Restaurant, isMobile: boolean = false): string {
  const query = encodeURIComponent(`${restaurant.name} ${restaurant.address}`);
  
  // For mobile devices, use the maps:// scheme which will open the Maps app
  if (isMobile && /iPhone|iPad|iPod|Android/i.test('navigator.userAgent')) {
    return `maps://?q=${query}`;
  }
  
  // For desktop, use the web URL
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}