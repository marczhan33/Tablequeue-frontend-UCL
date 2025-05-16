import { useEffect, useState } from "react";
import { Restaurant } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPin, Navigation, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GoogleMapsWaitTimeProps {
  restaurant: Restaurant;
}

export function GoogleMapsWaitTime({ restaurant }: GoogleMapsWaitTimeProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");

  // Detect if user is on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Get wait time text display
  function getWaitTimeText() {
    if (restaurant.customWaitTime && restaurant.customWaitTime > 0) {
      return `${restaurant.customWaitTime} minutes`;
    }

    switch (restaurant.currentWaitStatus) {
      case "available":
        return "No wait";
      case "short":
        return "15-30 minutes";
      case "long":
        return "30-60 minutes";
      case "very_long":
        return "60+ minutes";
      case "closed":
        return "Closed";
      default:
        return "Unknown";
    }
  }

  // Get color for current wait status
  function getWaitStatusColor() {
    switch (restaurant.currentWaitStatus) {
      case "available":
        return "bg-green-100 text-green-800";
      case "short":
        return "bg-blue-100 text-blue-800";
      case "long":
        return "bg-yellow-100 text-yellow-800";
      case "very_long":
        return "bg-orange-100 text-orange-800";
      case "closed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  // Generate Google Maps URL based on device
  function getMapsUrl() {
    const query = encodeURIComponent(`${restaurant.name} ${restaurant.address}`);
    
    if (isMobile) {
      // For iOS devices, use maps:// scheme
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        return `maps://?q=${query}`;
      }
      // For Android devices, use geo: scheme
      else if (/Android/i.test(navigator.userAgent)) {
        return `geo:0,0?q=${query}`;
      }
    }
    
    // Default to web URL for desktop or unsupported mobile browsers
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  // Copy address to clipboard
  const copyAddress = () => {
    navigator.clipboard.writeText(restaurant.address)
      .then(() => {
        setCopySuccess("Address copied!");
        setTimeout(() => setCopySuccess(""), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy address: ", err);
      });
  };

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="bg-primary/5 pb-2">
        <CardTitle className="text-primary flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Location Information
        </CardTitle>
        <CardDescription>
          Find this restaurant on Google Maps
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Current Wait Time:</div>
            <Badge variant="outline" className={`ml-2 font-medium ${getWaitStatusColor()}`}>
              <Clock className="h-3.5 w-3.5 mr-1" />
              {getWaitTimeText()}
            </Badge>
          </div>
          
          <div className="pt-2">
            <div className="flex justify-between items-start">
              <div className="text-sm text-muted-foreground">Address:</div>
              <div className="text-right text-sm font-medium max-w-[70%]">
                {restaurant.address}
                {copySuccess && (
                  <div className="text-green-600 text-xs mt-1">{copySuccess}</div>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs mt-1 h-7 px-2 w-full flex justify-end"
              onClick={copyAddress}
            >
              Copy Address
            </Button>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2 pt-0">
        <Button
          className="w-full flex items-center justify-center gap-2"
          onClick={() => window.open(getMapsUrl(), "_blank")}
        >
          <Navigation className="h-4 w-4" />
          Open in Google Maps
        </Button>
        
        <div className="text-xs text-center text-muted-foreground">
          Wait times in Google Maps are updated in real-time by the restaurant
        </div>
      </CardFooter>
    </Card>
  );
}