import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type TimeSlotPromo = {
  time: string;
  discount: number;
};

type PromoManagerProps = {
  restaurantId: number;
  initialPromotions?: TimeSlotPromo[];
};

export function RestaurantPromoManager({ restaurantId, initialPromotions }: PromoManagerProps) {
  const { toast } = useToast();
  
  const [promotions, setPromotions] = useState<TimeSlotPromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Load promotions from the API when the component mounts
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First try to fetch existing promotions from the API
        const response = await fetch(`/api/restaurants/${restaurantId}/promotions`);
        
        if (response.ok) {
          const data = await response.json();
          
          // If we have promotions from the API, use them
          if (data && data.length > 0) {
            setPromotions(data.map((p: { timeSlot: string; discount: number }) => ({
              time: p.timeSlot,
              discount: p.discount
            })));
          } else {
            // Otherwise use provided initialPromotions or generate defaults
            setPromotions(initialPromotions || generateDefaultPromotions());
          }
        } else {
          // If the API request failed, fall back to defaults
          setPromotions(initialPromotions || generateDefaultPromotions());
          if (response.status !== 404) {
            setError("Failed to load promotional offers. Using defaults instead.");
          }
        }
      } catch (err) {
        console.error("Error loading promotions:", err);
        setError("Could not load promotional offers. Using defaults instead.");
        setPromotions(initialPromotions || generateDefaultPromotions());
      } finally {
        setLoading(false);
      }
    };
    
    fetchPromotions();
  }, [restaurantId, initialPromotions]);
  
  // Function to generate default promotions for all time slots
  function generateDefaultPromotions(): TimeSlotPromo[] {
    const slots: TimeSlotPromo[] = [];
    
    // Generate time slots from 11:00 to 22:30 in 30 min increments
    for (let hour = 11; hour <= 22; hour++) {
      // Generate promotion for hour:00
      slots.push({
        time: `${hour}:00`,
        discount: getDefaultDiscount(hour, 0)
      });
      
      // Generate promotion for hour:30
      slots.push({
        time: `${hour}:30`,
        discount: getDefaultDiscount(hour, 30)
      });
    }
    
    return slots;
  }
  
  // Get default discount based on time
  function getDefaultDiscount(hour: number, minute: number): number {
    // Off-peak hours get higher discounts
    if (hour < 16) return 15; // Morning/afternoon
    if (hour > 20) return 10; // Late night
    
    // Peak dinner hours get lower discounts
    return hour === 18 || hour === 19 ? 0 : 5;
  }
  
  // Handle discount change
  const handleDiscountChange = (time: string, newDiscount: string) => {
    const discount = parseInt(newDiscount, 10);
    
    // Ensure discount is between 0-100
    const validDiscount = isNaN(discount) ? 0 : Math.min(100, Math.max(0, discount));
    
    setPromotions(prev => 
      prev.map(promo => 
        promo.time === time 
          ? { ...promo, discount: validDiscount } 
          : promo
      )
    );
  };
  
  // Save promotions to the server
  const savePromotions = async () => {
    try {
      setSaving(true);
      
      const response = await apiRequest(`/api/restaurants/${restaurantId}/promotions`, {
        method: 'POST',
        body: { promotions }
      });
      
      if (response.ok) {
        toast({
          title: "Promotions saved",
          description: "Your promotional offers have been updated successfully.",
        });
        
        // Invalidate restaurant data to refresh any views that depend on it
        queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}`] });
      } else {
        throw new Error("Failed to save promotions");
      }
    } catch (error) {
      toast({
        title: "Error saving promotions",
        description: "There was a problem saving your changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manage Promotional Offers</CardTitle>
        <CardDescription>
          Offer discounts during off-peak hours to balance customer demand throughout the day
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <p className="text-sm text-muted-foreground mb-4">
          Set discount percentages for each time slot to incentivize customers to book during off-peak times. 
          Higher discounts during slower periods can help distribute customer traffic more evenly.
        </p>
        
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Group time slots by part of day for better organization */}
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">Morning / Lunch (11:00 - 15:30)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {promotions
                  .filter(p => {
                    const hour = parseInt(p.time.split(':')[0], 10);
                    return hour >= 11 && hour <= 15;
                  })
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((promo) => (
                    <div key={promo.time} className="flex items-center space-x-2 border p-3 rounded-md hover:border-primary transition-colors">
                      <div className="font-medium w-16">{promo.time}</div>
                      <div className="flex-1">
                        <Label htmlFor={`discount-${promo.time}`} className="sr-only">
                          Discount for {promo.time}
                        </Label>
                        <div className="flex items-center">
                          <Input
                            id={`discount-${promo.time}`}
                            type="number"
                            min="0"
                            max="100"
                            value={promo.discount}
                            onChange={(e) => handleDiscountChange(promo.time, e.target.value)}
                            className="w-20 text-right"
                          />
                          <span className="ml-2 text-sm font-medium">% OFF</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">Evening / Dinner (16:00 - 20:30)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {promotions
                  .filter(p => {
                    const hour = parseInt(p.time.split(':')[0], 10);
                    return hour >= 16 && hour <= 20;
                  })
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((promo) => (
                    <div key={promo.time} className="flex items-center space-x-2 border p-3 rounded-md hover:border-primary transition-colors">
                      <div className="font-medium w-16">{promo.time}</div>
                      <div className="flex-1">
                        <Label htmlFor={`discount-${promo.time}`} className="sr-only">
                          Discount for {promo.time}
                        </Label>
                        <div className="flex items-center">
                          <Input
                            id={`discount-${promo.time}`}
                            type="number"
                            min="0"
                            max="100"
                            value={promo.discount}
                            onChange={(e) => handleDiscountChange(promo.time, e.target.value)}
                            className="w-20 text-right"
                          />
                          <span className="ml-2 text-sm font-medium">% OFF</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">Late Night (21:00 - 22:30)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {promotions
                  .filter(p => {
                    const hour = parseInt(p.time.split(':')[0], 10);
                    return hour >= 21;
                  })
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((promo) => (
                    <div key={promo.time} className="flex items-center space-x-2 border p-3 rounded-md hover:border-primary transition-colors">
                      <div className="font-medium w-16">{promo.time}</div>
                      <div className="flex-1">
                        <Label htmlFor={`discount-${promo.time}`} className="sr-only">
                          Discount for {promo.time}
                        </Label>
                        <div className="flex items-center">
                          <Input
                            id={`discount-${promo.time}`}
                            type="number"
                            min="0"
                            max="100"
                            value={promo.discount}
                            onChange={(e) => handleDiscountChange(promo.time, e.target.value)}
                            className="w-20 text-right"
                          />
                          <span className="ml-2 text-sm font-medium">% OFF</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
        
        <div className="mt-6 flex justify-end">
          <Button onClick={savePromotions} disabled={loading || saving}>
            {saving ? "Saving..." : "Save Promotional Offers"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}