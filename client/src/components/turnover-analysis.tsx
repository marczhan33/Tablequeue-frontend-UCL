import { useQuery, useMutation } from "@tanstack/react-query";
import { TableType, WaitlistEntry } from "@shared/schema";
import { analyzeTurnoverTimes, getTurnoverAnalysisDescription, generateTurnoverSummary } from "@/lib/turnover-analyzer";
import { Loader2, RefreshCw, Clock, CheckCircle2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TurnoverAnalysisProps {
  restaurantId: number;
}

export default function TurnoverAnalysis({ restaurantId }: TurnoverAnalysisProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();
  
  // Fetch table types
  const { data: tableTypes, isLoading: isLoadingTableTypes } = useQuery<TableType[]>({
    queryKey: [`/api/restaurants/${restaurantId}/table-types`],
  });
  
  // Fetch waitlist history
  const { data: waitlistHistory, isLoading: isLoadingWaitlist } = useQuery<WaitlistEntry[]>({
    queryKey: [`/api/restaurants/${restaurantId}/waitlist`],
  });
  
  // Only proceed if we have both data sets
  const isLoading = isLoadingTableTypes || isLoadingWaitlist;
  const hasData = !isLoading && tableTypes && tableTypes.length > 0 && waitlistHistory && waitlistHistory.length > 0;
  
  // Generate analysis if data is available
  const analysis = hasData 
    ? analyzeTurnoverTimes(tableTypes!, waitlistHistory!) 
    : [];
    
  const summary = analysis.length > 0 
    ? generateTurnoverSummary(analysis)
    : null;
  
  // Check if we have any recommendations
  const hasRecommendations = analysis.some(item => item.recommendation);
  
  // Mutation for applying recommendations
  const applyRecommendations = useMutation({
    mutationFn: async () => {
      // Format recommendations for the API
      const recommendations = analysis
        .filter(item => item.recommendation)
        .map(item => ({
          tableTypeId: item.tableTypeId,
          suggestedTime: item.recommendation?.suggestedTime
        }));
      
      return await apiRequest({
        url: `/api/restaurants/${restaurantId}/apply-turnover-recommendations`,
        method: "POST",
        body: { recommendations }
      });
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/table-types`] });
      
      toast({
        title: "Recommendations Applied",
        description: "Table turnover times have been updated with the recommended values.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to apply recommendations: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  });
  
  return (
    <div className="bg-white border rounded-lg shadow-sm p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Table Turnover Analysis</h3>
        <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !hasData ? (
        <div className="text-center py-6 text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>Not enough data yet to analyze turnover times.</p>
          <p className="text-sm mt-1">Analysis will appear as more customers are seated.</p>
        </div>
      ) : (
        <>
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Tables Analyzed</p>
                <p className="text-2xl font-semibold">{summary.totalTablesAnalyzed}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Avg. Turnover Time</p>
                <p className="text-2xl font-semibold">{summary.averageTurnoverTime} min</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Tables Needing Adjustment</p>
                <p className="text-2xl font-semibold">{summary.tablesNeedingAdjustment}</p>
              </div>
            </div>
          )}
          
          {hasRecommendations && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3 flex-grow">
                  <h3 className="text-sm font-medium text-blue-800">Turnover Time Recommendations Available</h3>
                  <div className="mt-1 text-sm text-blue-700">
                    Based on actual seating data, we suggest adjusting turnover times for {summary?.tablesNeedingAdjustment} table types.
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => applyRecommendations.mutate()}
                    disabled={applyRecommendations.isPending}
                    className="flex items-center text-xs"
                  >
                    {applyRecommendations.isPending ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-1 h-3 w-3" />
                        Apply All Recommendations
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {showDetails && (
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sample Size</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analysis.map((item) => {
                    const tableType = tableTypes?.find(t => t.id === item.tableTypeId);
                    return (
                      <tr key={item.tableTypeId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.tableName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.actualTurnoverTime} min</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sampleSize} uses</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            item.confidence === 'high' ? 'bg-green-100 text-green-800' :
                            item.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.confidence === 'high' ? 'High' : 
                             item.confidence === 'medium' ? 'Medium' : 'Low'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {item.recommendation ? (
                            <div className="text-amber-600 flex items-center">
                              <RefreshCw className="h-4 w-4 mr-1" />
                              <span>
                                Update to {item.recommendation.suggestedTime} min 
                                ({item.recommendation.percentDifference > 0 ? '+' : ''}{item.recommendation.percentDifference}%)
                              </span>
                            </div>
                          ) : (
                            <div className="text-green-600 flex items-center">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              <span>Accurate</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      
      <div className="mt-4 text-sm text-gray-500">
        <p>This analysis compares your estimated turnover times with actual usage data from your restaurant's history.</p>
        <p className="mt-1">Accurate turnover times help provide better wait time predictions for your customers.</p>
      </div>
    </div>
  );
}