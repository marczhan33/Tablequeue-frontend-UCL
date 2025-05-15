import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { qrCodeCustomerFormSchema } from "@shared/schema";
import { Loader2, Clock, CheckCircle } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";

type FormValues = z.infer<typeof qrCodeCustomerFormSchema>;

export default function JoinWaitlist() {
  const [, params] = useRoute("/join-waitlist/:qrCodeId");
  const qrCodeId = params?.qrCodeId;
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [joinStatus, setJoinStatus] = useState<"idle" | "submitting" | "success">("idle");

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/restaurants/qr", qrCodeId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/restaurants/qr/${qrCodeId}`);
        if (!response.ok) {
          throw new Error("Invalid QR code");
        }
        return response.json();
      } catch (err) {
        console.error("Error fetching restaurant:", err);
        throw new Error("Error fetching restaurant information");
      }
    },
    enabled: !!qrCodeId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(qrCodeCustomerFormSchema),
    defaultValues: {
      customerName: "",
      partySize: 1,
      phoneNumber: "",
      dietaryRequirements: "",
      specialRequests: ""
    }
  });

  const joinWaitlistMutation = useMutation({
    mutationFn: async (formData: FormValues) => {
      if (!data?.restaurant?.id) throw new Error("Restaurant ID is required");
      const restaurantId = data.restaurant.id;

      return apiRequest(`/api/restaurants/${restaurantId}/waitlist`, { 
        method: "POST", 
        body: formData 
      });
    },
    onSuccess: () => {
      setJoinStatus("success");
      toast({
        title: "Added to waitlist!",
        description: "You've been added to the restaurant's waitlist. Restaurant staff will notify you when your table is ready.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error joining waitlist",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: FormValues) => {
    if (!data?.restaurant?.id) {
      toast({
        title: "Error",
        description: "Restaurant information missing",
        variant: "destructive",
      });
      return;
    }

    setJoinStatus("submitting");
    joinWaitlistMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading restaurant information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6 max-w-md text-center">
          <p className="font-semibold text-lg">Invalid QR Code</p>
          <p className="mt-2">This QR code is invalid or has expired. Please scan a valid QR code from the restaurant.</p>
        </div>
        <Button onClick={() => setLocation("/")}>Go Home</Button>
      </div>
    );
  }

  if (joinStatus === "success") {
    return (
      <div className="container max-w-md mx-auto p-4 mt-8">
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-primary/10 rounded-t-lg">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-center">You're on the List!</CardTitle>
            <CardDescription className="text-center text-base">
              You've successfully joined the waitlist for {data?.restaurant.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-muted-foreground">Restaurant</span>
                <span className="font-medium">{data?.restaurant.name}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-muted-foreground">Estimated Wait Time</span>
                <span className="font-medium">{data?.estimatedWaitTime || "N/A"} minutes</span>
              </div>
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-muted-foreground">Current Queue</span>
                <span className="font-medium">{data?.queueLength || 0} parties ahead of you</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Party Size</span>
                <span className="font-medium">{form.getValues("partySize")} people</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              Restaurant staff will notify you when your table is ready. Please stay in the vicinity of the restaurant.
            </div>
            <Button onClick={() => setLocation("/")} variant="outline" className="w-full">Return Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto p-4 mt-8">
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle>Join the Waitlist</CardTitle>
          <CardDescription>
            Please provide your details to be added to {data?.restaurant.name}'s waitlist.
          </CardDescription>
          {data?.waitStatus && (
            <div className="flex items-center space-x-2 mt-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Current Wait:</span>
                <Badge variant={data.waitStatus === 'short' ? 'outline' : data.waitStatus === 'long' ? 'secondary' : 'destructive'}>
                  {data.waitStatus === 'available' && 'No Wait'}
                  {data.waitStatus === 'short' && 'Short Wait'}
                  {data.waitStatus === 'long' && 'Long Wait'}
                  {data.waitStatus === 'very_long' && 'Very Long Wait'}
                  {data.waitStatus === 'closed' && 'Closed'}
                </Badge>
              </div>
            </div>
          )}
          {data?.queueLength > 0 && (
            <div className="mt-2 text-sm">
              <span className="font-medium text-amber-600">{data.queueLength}</span> parties currently in line
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="partySize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Party Size</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select party size" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'person' : 'people'}
                            </SelectItem>
                          ))}
                          <SelectItem value="13">13+ people</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {data?.tableTypes && data.tableTypes.length > 0 && (
                <FormField
                  control={form.control}
                  name="tableTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Table Type (Optional)</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value?.toString() || ""}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select table type" />
                          </SelectTrigger>
                          <SelectContent>
                            {data.tableTypes.map((type: { id: number, name: string, capacity: number }) => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.name} (Seats {type.capacity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      For SMS notifications when your table is ready
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dietaryRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dietary Requirements (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any allergies or dietary restrictions?" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={joinStatus === "submitting"}
              >
                {joinStatus === "submitting" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Waitlist"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}