import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type ConfirmationStatus = "loading" | "confirming" | "success" | "error";

export default function ConfirmArrival() {
  const [, params] = useRoute("/confirm-arrival/:restaurantId/:confirmationCode");
  const restaurantId = params?.restaurantId ? parseInt(params.restaurantId) : null;
  const confirmationCode = params?.confirmationCode || "";
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<ConfirmationStatus>("loading");
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!restaurantId) throw new Error("Invalid restaurant ID");
      
      try {
        const response = await apiRequest(
          "POST", 
          `/api/restaurants/${restaurantId}/remote-waitlist/${confirmationCode}/confirm`
        );
        const data = await response.json();
        if (data.restaurant?.name) {
          setRestaurantName(data.restaurant.name);
        }
        return data;
      } catch (error: any) {
        setErrorMessage(error.message || "Failed to confirm arrival");
        throw error;
      }
    },
    onSuccess: () => {
      setStatus("success");
      toast({
        title: "Arrival confirmed!",
        description: "Your arrival has been confirmed and you've been added to the waitlist.",
      });
    },
    onError: (error: Error) => {
      setStatus("error");
      toast({
        title: "Error confirming arrival",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (restaurantId && confirmationCode) {
      setStatus("confirming");
      confirmMutation.mutate();
    } else {
      setStatus("error");
      setErrorMessage("Invalid confirmation link");
    }
  }, [restaurantId, confirmationCode]);

  if (status === "loading" || status === "confirming") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg">Confirming your arrival...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="container max-w-md mx-auto p-4 mt-8">
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-destructive/10 rounded-t-lg">
            <div className="flex items-center justify-center mb-4">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-center">Confirmation Failed</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-center mb-4">
              {errorMessage || "We couldn't confirm your arrival. This confirmation code may be invalid or expired."}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => setLocation("/")} variant="outline">Return Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto p-4 mt-8">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-primary/10 rounded-t-lg">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-center">Arrival Confirmed!</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-center mb-4">
            We've confirmed your arrival at {restaurantName || "the restaurant"}. 
            You've been added to the waitlist and restaurant staff will notify you when your table is ready.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Please remain in the vicinity of the restaurant to ensure you don't miss your turn.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => setLocation("/")} variant="outline">Return Home</Button>
        </CardFooter>
      </Card>
    </div>
  );
}