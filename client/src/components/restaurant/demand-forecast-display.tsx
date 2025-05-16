import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemandForecastDisplayProps {
  restaurantId: number;
  showDemandShifting?: boolean;
}

interface HourlyDemand {
  hour: number;
  demand: number;
  isHighDemand: boolean;
  suggestedDiscount?: number;
  isCurrent?: boolean;
}

interface DemandForecast {
  date: string;
  hourlyDemand: HourlyDemand[];
  peakHours: number[];
  lowDemandHours: number[];
  demandShiftingRecommendations: {
    fromHour: number;
    toHour: number;
    potentialReduction: number;
    message: string;
  }[];
}

export function DemandForecastDisplay({ restaurantId, showDemandShifting = true }: DemandForecastDisplayProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("demand");

  const dateParam = selectedDate ? selectedDate.toISOString().split('T')[0] : undefined;

  const { data, isLoading, error, refetch } = useQuery<DemandForecast>({
    queryKey: [`/api/restaurants/${restaurantId}/demand-forecast`, dateParam],
    queryFn: () => 
      fetch(`/api/restaurants/${restaurantId}/demand-forecast?date=${dateParam}`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch demand forecast");
          return res.json();
        }),
    enabled: !!restaurantId,
  });

  // Table efficiency data
  const { data: tableData, isLoading: tableLoading } = useQuery({
    queryKey: [`/api/restaurants/${restaurantId}/table-efficiency`],
    queryFn: () => 
      fetch(`/api/restaurants/${restaurantId}/table-efficiency`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch table efficiency");
          return res.json();
        }),
    enabled: !!restaurantId && activeTab === "tables",
  });

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // Format the hour to AM/PM display
  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
  };

  // Get color based on demand level
  const getDemandColor = (demand: number) => {
    if (demand <= 3) return "bg-green-500";
    if (demand <= 5) return "bg-blue-500";
    if (demand <= 7) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-60">
          <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-destructive/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-destructive flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Error Loading Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load demand forecast data. Please try again later.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            className="mt-4"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Smart Wait Time Optimization</CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const today = new Date();
                setSelectedDate(today);
              }}
            >
              Today
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedDate(tomorrow);
              }}
            >
              Tomorrow
            </Button>
          </div>
        </div>
        <CardDescription>
          Analyze demand patterns and optimize wait times using operation management strategies
        </CardDescription>
      </CardHeader>

      <Tabs defaultValue="demand" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="demand">Demand Forecast</TabsTrigger>
            <TabsTrigger value="tables">Table Efficiency</TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="pt-4">
          <TabsContent value="demand" className="mt-0">
            {data && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Hourly Demand Forecast</h3>
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
                    {data.hourlyDemand.map((hour) => (
                      <div 
                        key={hour.hour}
                        className={cn(
                          "flex flex-col items-center p-2 rounded-md transition-colors",
                          hour.isCurrent && "bg-primary/10 border border-primary/30",
                          !hour.isCurrent && "hover:bg-accent"
                        )}
                      >
                        <div className="text-xs font-medium mb-1">{formatHour(hour.hour)}</div>
                        <div 
                          className={cn(
                            "w-full h-[60px] rounded-sm relative flex flex-col items-center justify-end",
                            "bg-accent"
                          )}
                        >
                          <div 
                            className={cn(
                              "w-full rounded-sm",
                              getDemandColor(hour.demand)
                            )}
                            style={{ height: `${hour.demand * 10}%` }}
                          />
                        </div>
                        <div className="mt-1 flex flex-col items-center">
                          <span className="text-xs">{hour.demand}/10</span>
                          {hour.suggestedDiscount && hour.suggestedDiscount > 0 && (
                            <Badge variant="outline" className="text-[10px] h-4 mt-1 bg-green-50 text-green-700 border-green-200">
                              {hour.suggestedDiscount}% Off
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {showDemandShifting && data.demandShiftingRecommendations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Demand Shifting Recommendations</h3>
                    <div className="space-y-2">
                      {data.demandShiftingRecommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 bg-accent/50 p-3 rounded-md">
                          <TrendingDown className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">
                              Shift from {formatHour(rec.fromHour)} to {formatHour(rec.toHour)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {rec.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tables" className="mt-0">
            {tableLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary/70" />
              </div>
            ) : tableData ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Table Utilization</h3>
                  <div className="space-y-3">
                    {tableData.metrics.map((table) => (
                      <div key={table.tableTypeId} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>
                            {table.tableType} (Capacity: {table.capacity}, Count: {table.count})
                          </span>
                          <span className="font-medium">{table.utilization}% utilized</span>
                        </div>
                        <Progress value={table.utilization} className="h-2" />
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            Avg. wasted seats: {table.avgWastedSeats}
                          </span>
                          {parseFloat(table.avgWastedSeats) > 1.5 && (
                            <Badge variant="outline" className="text-xs h-5 bg-yellow-50 text-yellow-700 border-yellow-200">
                              Inefficient
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Wait Time Optimization</h3>
                  <div className="bg-primary/5 p-4 rounded-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-primary" />
                        <span className="font-medium">Current Avg. Wait</span>
                      </div>
                      <span>{tableData.waitTimeOptimization.currentAvgWaitTime} min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <TrendingDown className="h-5 w-5 mr-2 text-green-600" />
                        <span className="font-medium">Optimized Wait</span>
                      </div>
                      <span>{tableData.waitTimeOptimization.estimatedReducedWaitTime} min</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-primary/10">
                      <div className="flex items-center justify-between text-sm">
                        <span>Potential reduction</span>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          {tableData.waitTimeOptimization.waitTimeReduction}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Recommendations</h3>
                  <ul className="space-y-2">
                    {tableData.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start text-sm">
                        <TrendingUp className="h-4 w-4 mr-2 text-primary flex-shrink-0 mt-0.5" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">No table data available</p>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}