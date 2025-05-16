import { useState, useEffect } from 'react';
import { calculateWaitTime, formatWaitTime, formatTime, CapacityAnalytics } from '@/lib/smart-capacity';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, Users, CalendarClock, Calendar } from 'lucide-react';

interface SmartCapacityDisplayProps {
  restaurantId: number;
  partySize: number;
}

export function SmartCapacityDisplay({ restaurantId, partySize }: SmartCapacityDisplayProps) {
  const [capacityData, setCapacityData] = useState<CapacityAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  
  // We're getting the restaurant from the parent component now
  
  // Define the prediction response type
  interface CapacityPredictionResponse {
    restaurantId: number;
    partySize: number;
    estimatedWaitTime: number;
    nextAvailableTime: string;
    recommendedArrivalTime?: string;
    busyLevel: number;
    confidence: 'high' | 'medium' | 'low';
    availableTables: number;
  }
  
  // Fetch capacity prediction directly from the API using a simpler approach
  const [prediction, setPrediction] = useState<CapacityPredictionResponse | null>(null);
  const [predictionError, setPredictionError] = useState<boolean>(false);
  
  useEffect(() => {
    if (restaurantId && partySize > 0) {
      setLoading(true);
      console.log(`Fetching capacity prediction for restaurant ${restaurantId} with party size ${partySize}`);
      
      // Create a more explicit URL
      const url = `/api/restaurants/${restaurantId}/capacity-prediction?partySize=${partySize}`;
      console.log("Prediction URL:", url);
      
      fetch(url)
        .then(response => {
          console.log("Prediction API response status:", response.status);
          if (!response.ok) {
            throw new Error(`Failed to fetch capacity prediction (status ${response.status})`);
          }
          return response.json();
        })
        .then(data => {
          console.log("Prediction API data received:", data);
          setPrediction(data);
        })
        .catch(err => {
          console.error('Error fetching prediction:', err);
          setPredictionError(true);
          setLoading(false);
        });
    } else {
      console.log(`Invalid inputs for prediction: restaurantId=${restaurantId}, partySize=${partySize}`);
    }
  }, [restaurantId, partySize]);
  
  // Update capacity data when prediction is available
  useEffect(() => {
    if (prediction) {
      try {
        // Transform API response to match our CapacityAnalytics interface
        const analytics: CapacityAnalytics = {
          estimatedWaitTime: prediction.estimatedWaitTime,
          confidence: prediction.confidence,
          availableTables: prediction.availableTables,
          busyLevel: prediction.busyLevel,
          nextAvailableTime: new Date(prediction.nextAvailableTime),
          recommendedArrivalTime: prediction.recommendedArrivalTime ? 
            new Date(prediction.recommendedArrivalTime) : undefined
        };
        
        console.log("Setting capacity data with:", analytics);
        setCapacityData(analytics);
      } catch (err) {
        console.error("Error processing prediction data:", err);
        setPredictionError(true);
      } finally {
        setLoading(false);
      }
    }
  }, [prediction]);
  
  if (predictionError) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex flex-col justify-center items-center h-40">
          <p className="text-red-500 mb-2">Unable to load wait time prediction</p>
          <p className="text-sm text-gray-500">Try refreshing the page or contact support.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (loading || !capacityData) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </CardContent>
      </Card>
    );
  }
  
  // Get confidence level color
  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low'): string => {
    switch (confidence) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <Card className="w-full overflow-hidden shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center">
          Smart Wait Prediction
          <Badge 
            variant="outline" 
            className="ml-auto"
          >
            <span className={`mr-1.5 h-2 w-2 rounded-full ${getConfidenceColor(capacityData.confidence)}`}></span>
            {`${capacityData.confidence.charAt(0).toUpperCase()}${capacityData.confidence.slice(1)} Confidence`}
          </Badge>
        </CardTitle>
        <CardDescription>
          For party of {partySize}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Estimated Wait</span>
            <div className="flex items-center mt-2">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              <span className="text-3xl font-semibold">
                {formatWaitTime(capacityData.estimatedWaitTime)}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Available Tables</span>
            <div className="flex items-center mt-2">
              <Users className="h-5 w-5 mr-2 text-primary" />
              <span className="text-3xl font-semibold">
                {capacityData.availableTables}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Est. Seating Time</span>
            <div className="flex items-center mt-2">
              <CalendarClock className="h-5 w-5 mr-2 text-primary" />
              <span className="text-xl font-medium">
                {formatTime(capacityData.nextAvailableTime)}
              </span>
            </div>
          </div>
          
          {capacityData.recommendedArrivalTime && (
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Recommended Arrival</span>
              <div className="flex items-center mt-2">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                <span className="text-xl font-medium">
                  {formatTime(capacityData.recommendedArrivalTime)}
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Current Capacity</span>
            <span className="text-sm font-medium">{capacityData.busyLevel}%</span>
          </div>
          <Progress value={capacityData.busyLevel} className="h-3" />
        </div>
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground border-t pt-4">
        Wait times are estimated and may vary based on actual restaurant conditions.
      </CardFooter>
    </Card>
  );
}