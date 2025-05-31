import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from 'wouter';
import { Loader2, TrendingUp, Clock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface TurnoverAnalyticsProps {
  restaurantId: number;
}

interface TurnoverAnalytics {
  seasonalTrends: {
    byMonth: { month: string; averageTurnover: number }[];
    byDayOfWeek: { day: string; averageTurnover: number }[];
    byHourOfDay: { hour: string; averageTurnover: number }[];
  };
  industryComparison: {
    restaurantAverage: number;
    industryAverage: number;
    regionalAverage: number;
    percentileBenchmark: number;
    similarRestaurants: { 
      name: string;
      turnoverTime: number;
      location: string;
    }[];
  };
}

export function TurnoverAnalysis({ restaurantId }: TurnoverAnalyticsProps) {
  const { toast } = useToast();
  
  const {
    data: analytics,
    isLoading,
    error
  } = useQuery<TurnoverAnalytics>({
    queryKey: [`/api/restaurants/${restaurantId}/turnover-analytics`],
    enabled: !!restaurantId
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Turnover Analytics</CardTitle>
          <CardDescription>Error loading analytics data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load turnover analytics. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!analytics || !analytics.seasonalTrends || !analytics.industryComparison) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Turnover Analytics</CardTitle>
          <CardDescription>Not enough data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Start tracking more customer seating data to see analytics here.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Turnover Analytics
        </CardTitle>
        <CardDescription>
          Analyze table turnover data to optimize your restaurant operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="seasonal">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="seasonal">Seasonal Trends</TabsTrigger>
            <TabsTrigger value="comparison">Industry Comparison</TabsTrigger>
          </TabsList>
          
          <TabsContent value="seasonal" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Monthly trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Trends</CardTitle>
                  <CardDescription>Average turnover time by month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.seasonalTrends.byMonth || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis name="Minutes" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="averageTurnover" name="Avg. Minutes" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Day of week trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Day of Week Trends</CardTitle>
                  <CardDescription>Average turnover time by day</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.seasonalTrends.byDayOfWeek || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis name="Minutes" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="averageTurnover" name="Avg. Minutes" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Hourly trends */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hourly Trends</CardTitle>
                <CardDescription>Average turnover time throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.seasonalTrends.byHourOfDay || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="averageTurnover" 
                        name="Avg. Minutes" 
                        stroke="#ff7300" 
                        strokeWidth={2} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="comparison">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Your Average</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    <Clock className="h-8 w-8 text-primary mb-2" />
                    <span className="text-3xl font-bold">{analytics.industryComparison.restaurantAverage}</span>
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Industry Average</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    <Clock className="h-8 w-8 text-amber-500 mb-2" />
                    <span className="text-3xl font-bold">{analytics.industryComparison.industryAverage}</span>
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Your Percentile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
                    <span className="text-3xl font-bold">{analytics.industryComparison.percentileBenchmark}%</span>
                    <span className="text-sm text-muted-foreground">industry ranking</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Regional Comparison</CardTitle>
                <CardDescription>How you compare to restaurants in your area</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        { name: 'Your Restaurant', value: analytics.industryComparison.restaurantAverage },
                        { name: 'Regional Avg.', value: analytics.industryComparison.regionalAverage },
                        { name: 'Industry Avg.', value: analytics.industryComparison.industryAverage },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Turnover Time (min)" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}