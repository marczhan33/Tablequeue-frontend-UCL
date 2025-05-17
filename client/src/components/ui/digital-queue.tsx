import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Users, AlarmClock, Calendar, Smartphone, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Restaurant } from "@shared/schema";

interface DigitalQueueProps {
  restaurant: Restaurant;
  partySize?: number;
  onQueueJoin?: () => void;
}

export function DigitalQueue({ restaurant, partySize = 2, onQueueJoin }: DigitalQueueProps) {
  const [activeTab, setActiveTab] = useState("now");
  const [selectedTime, setSelectedTime] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [size, setSize] = useState(partySize.toString());
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [timeSlotPromotions, setTimeSlotPromotions] = useState<{ timeSlot: string; discount: number }[]>([]);
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(false);
  const { toast } = useToast();

  // Fetch time slot promotions from the API
  React.useEffect(() => {
    const fetchPromotions = async () => {
      setIsLoadingPromotions(true);
      try {
        const response = await fetch(`/api/restaurants/${restaurant.id}/promotions`);
        if (response.ok) {
          const data = await response.json();
          setTimeSlotPromotions(data);
        } else {
          console.error("Failed to fetch promotions:", await response.text());
        }
      } catch (error) {
        console.error("Error fetching promotions:", error);
      } finally {
        setIsLoadingPromotions(false);
      }
    };

    fetchPromotions();
  }, [restaurant.id]);

  // Generate available time slots in 30-minute increments
  // starting from current time, for the next 2 hours
  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Round to next 30-minute increment
    let minuteIncrement = Math.ceil(currentMinute / 30) * 30;
    let hourToUse = currentHour;
    if (minuteIncrement === 60) {
      hourToUse += 1;
      minuteIncrement = 0;
    }
    
    // Generate slots
    for (let hour = hourToUse; hour < hourToUse + 3; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip past time slots
        if (hour === hourToUse && minute < minuteIncrement) continue;
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Here we would make an API call to join the queue
    // For now, we'll simulate a successful API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowConfirmation(true);
      
      // Call the callback if provided
      if (onQueueJoin) {
        onQueueJoin();
      }
    }, 1500);
  };

  const getWaitTimeDisplay = () => {
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
      default:
        return "Unknown";
    }
  };

  // Calculate the color for wait time badge
  const getWaitTimeBadgeColor = () => {
    switch (restaurant.currentWaitStatus) {
      case "available":
        return "bg-green-100 text-green-800";
      case "short":
        return "bg-blue-100 text-blue-800";
      case "long":
        return "bg-yellow-100 text-yellow-800";
      case "very_long":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get the discount for a specific time slot from our fetched promotions
  const getTimeSlotDiscount = (timeSlot: string) => {
    // Find the matching promotion for this time slot
    const promotion = timeSlotPromotions.find(p => p.timeSlot === timeSlot);
    
    // Return the discount percentage if found, otherwise 0
    return promotion ? promotion.discount : 0;
  };

  return (
    <>
      <Card className="shadow-md border-0">
        <CardHeader className="bg-primary/5 pb-2">
          <CardTitle className="flex items-center text-primary">
            <svg className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8V12L14.5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M7 5C6 4 4.5 4 3.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M17 5C18 4 19.5 4 20.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
            </svg>
            Digital Queue System
          </CardTitle>
          <CardDescription>
            Join the waitlist in advance and spend less time waiting
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Current wait time:</div>
            <Badge variant="outline" className={`ml-2 font-medium ${getWaitTimeBadgeColor()}`}>
              <Clock className="h-3.5 w-3.5 mr-1" />
              {getWaitTimeDisplay()}
            </Badge>
          </div>
          
          <Tabs defaultValue="now" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="now">Join Now</TabsTrigger>
              <TabsTrigger value="later">Schedule For Later</TabsTrigger>
            </TabsList>
            
            <TabsContent value="now" className="pt-4">
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="For text notifications"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="size">Party Size</Label>
                    <Select 
                      value={size} 
                      onValueChange={setSize}
                    >
                      <SelectTrigger id="size">
                        <SelectValue placeholder="Select party size" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? 'person' : 'people'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Special Requests (Optional)</Label>
                    <Input
                      id="notes"
                      placeholder="Allergies, preferences, etc."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full mt-6" 
                  disabled={isSubmitting || !name || !phone}
                >
                  {isSubmitting ? "Joining Queue..." : "Join Queue Now"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="later" className="pt-4">
              <div className="space-y-4">
                <div>
                  <Label>Choose Arrival Time</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {timeSlots.map((time) => {
                      const discount = getTimeSlotDiscount(time);
                      return (
                        <div
                          key={time}
                          className={`border rounded-md p-2 text-center cursor-pointer transition-colors ${
                            selectedTime === time
                              ? "border-primary bg-primary/10"
                              : "hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedTime(time)}
                        >
                          <div className="font-medium">{time}</div>
                          {discount > 0 && (
                            <div className="text-xs text-green-600 font-semibold mt-1">
                              {discount}% OFF
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <form onSubmit={handleSubmit} className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name-later">Your Name</Label>
                      <Input
                        id="name-later"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone-later">Phone Number</Label>
                      <Input
                        id="phone-later"
                        placeholder="For text notifications"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="size-later">Party Size</Label>
                      <Select 
                        value={size} 
                        onValueChange={setSize}
                      >
                        <SelectTrigger id="size-later">
                          <SelectValue placeholder="Select party size" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'person' : 'people'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full mt-6" 
                    disabled={isSubmitting || !name || !phone || !selectedTime}
                  >
                    {isSubmitting ? "Scheduling..." : "Schedule Arrival"}
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex flex-col pt-0">
          <div className="text-xs text-center text-muted-foreground mt-2">
            {activeTab === "now" ? (
              "You'll receive text updates about your position in line"
            ) : (
              "Schedule a future arrival to reduce your wait time and get special offers"
            )}
          </div>
        </CardFooter>
      </Card>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-primary">
              <Users className="h-5 w-5 mr-2" />
              You're in the Queue!
            </DialogTitle>
            <DialogDescription>
              We've added you to the waitlist at {restaurant.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Party Name</Label>
                <p className="font-medium">{name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Party Size</Label>
                <p className="font-medium">{size} {parseInt(size) === 1 ? 'person' : 'people'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">
                  {activeTab === "now" ? "Estimated Wait" : "Arrival Time"}
                </Label>
                <p className="font-medium">
                  {activeTab === "now" ? getWaitTimeDisplay() : selectedTime}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Notification Number</Label>
                <p className="font-medium">{phone}</p>
              </div>
            </div>
            
            <div className="rounded-md bg-muted p-4 mt-4">
              <div className="flex gap-2 items-start">
                <Smartphone className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium">Stay Updated</h4>
                  <p className="text-sm text-muted-foreground">
                    You'll receive text updates as your table gets closer to being ready. 
                    We'll send a final notification when your table is ready.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => {
                setShowConfirmation(false);
                toast({
                  title: "Queue confirmation sent",
                  description: "Check your phone for a confirmation message.",
                });
              }}
              className="w-full sm:w-auto"
            >
              View Queue Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}