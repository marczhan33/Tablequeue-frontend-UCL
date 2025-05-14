import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  ChevronLeft, 
  Loader2, 
  TrendingUp,
  BarChart3,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { Restaurant } from "@shared/schema";
import { TurnoverAnalysis } from "@/components/turnover-analysis";

export default function RestaurantAnalytics() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  const restaurantId = parseInt(id);
  
  const { data: restaurant, isLoading: restaurantLoading } = useQuery<Restaurant>({
    queryKey: [`/api/restaurants/${restaurantId}`],
    enabled: !!restaurantId && !isNaN(restaurantId)
  });
  
  if (restaurantLoading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!restaurant) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">Restaurant not found</h1>
        <p className="text-muted-foreground mb-4">
          The restaurant you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Link href="/">
          <Button variant="default">Go back to dashboard</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Link href={`/restaurants/${restaurantId}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back to Restaurant
          </Button>
        </Link>
        <h1 className="text-2xl font-bold ml-2">{restaurant.name} Analytics</h1>
      </div>
      
      <Tabs defaultValue="turnover">
        <TabsList className="mb-6">
          <TabsTrigger value="turnover" className="gap-1">
            <TrendingUp className="h-4 w-4" />
            Turnover Analysis
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-1"> 
            <Users className="h-4 w-4" />
            Customer Insights
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1">
            <BarChart3 className="h-4 w-4" />
            Performance Metrics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="turnover" className="space-y-6">
          <TurnoverAnalysis restaurantId={restaurantId} />
        </TabsContent>
        
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Analytics</CardTitle>
              <CardDescription>
                Understand your customer patterns and behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Customer analytics functionality coming soon. Track demographics, repeat visits,
                and customer preferences to improve your service.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Track key restaurant performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Performance metrics functionality coming soon. View revenue trends, 
                staff efficiency, and comprehensive financial analytics.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}