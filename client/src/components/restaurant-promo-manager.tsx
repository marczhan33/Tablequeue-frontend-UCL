import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

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
  
  // Initialize with default promotions or provided promotions
  const [promotions, setPromotions] = useState<TimeSlotPromo[]>(
    initialPromotions || generateDefaultPromotions()
  );
  
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
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manage Promotional Offers</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Set discount percentages for each time slot to incentivize customers to book during off-peak times.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map((promo) => (
            <div key={promo.time} className="flex items-center space-x-2 border p-3 rounded-md">
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
                    className="w-16 text-right"
                  />
                  <span className="ml-2">% OFF</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button onClick={savePromotions}>
            Save Promotional Offers
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}