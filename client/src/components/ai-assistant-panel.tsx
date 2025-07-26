import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  Brain, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';

interface AISuggestion {
  action: 'seat_immediately' | 'combine_tables' | 'wait_for_optimal' | 'notify_early';
  partyId?: number;
  tableAssignment?: {
    tableTypeId: number;
    tableCount: number;
    confidence: number;
    reasoning: string;
  };
  estimatedWaitReduction?: number;
  reasoning: string;
  confidence: number;
}

interface DemandPrediction {
  timeSlot: string;
  predictedWaitTime: number;
  predictedPartySize: number;
  confidenceLevel: number;
  factors: string[];
}

interface CapacityRecommendation {
  recommendedAction: 'increase_staff' | 'prepare_combinations' | 'extend_hours' | 'optimize_turnover';
  reasoning: string;
  impact: number;
  priority: 'high' | 'medium' | 'low';
}

interface AIAssistantPanelProps {
  restaurantId: number;
}

export function AIAssistantPanel({ restaurantId }: AIAssistantPanelProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('suggestions');

  // Fetch AI suggestions
  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['ai-suggestions', restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${restaurantId}/ai-suggestions`);
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch demand predictions
  const { data: predictionsData, isLoading: predictionsLoading } = useQuery({
    queryKey: ['demand-predictions', restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${restaurantId}/demand-predictions`);
      return response.json();
    },
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  // Apply AI suggestion mutation
  const applySuggestionMutation = useMutation({
    mutationFn: async ({ suggestionId, partyId, tableAssignment }: any) => {
      const response = await fetch(`/api/restaurants/${restaurantId}/apply-ai-suggestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId, partyId, tableAssignment })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions', restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['waitlist', restaurantId] });
    }
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'seat_immediately': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'combine_tables': return <Users className="h-4 w-4 text-blue-500" />;
      case 'notify_early': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'wait_for_optimal': return <Target className="h-4 w-4 text-purple-500" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'seat_immediately': return 'Seat Now';
      case 'combine_tables': return 'Combine Tables';
      case 'notify_early': return 'Notify Early';
      case 'wait_for_optimal': return 'Wait Optimal';
      default: return action;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Restaurant Assistant
        </CardTitle>
        <CardDescription>
          Intelligent optimization suggestions powered by AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Suggestions
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Predictions
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* AI Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Current Optimization Suggestions</h3>
              <Badge variant="outline">
                {suggestionsData?.totalSuggestions || 0} suggestions
              </Badge>
            </div>

            {suggestionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : suggestionsData?.suggestions?.length > 0 ? (
              <div className="space-y-3">
                {suggestionsData.suggestions.map((suggestion: AISuggestion, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getActionIcon(suggestion.action)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {getActionLabel(suggestion.action)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.confidence}% confidence
                            </Badge>
                            {suggestion.estimatedWaitReduction && (
                              <Badge variant="default" className="text-xs">
                                -{suggestion.estimatedWaitReduction}min wait
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {suggestion.reasoning}
                          </p>
                          {suggestion.tableAssignment && (
                            <p className="text-xs text-muted-foreground">
                              {suggestion.tableAssignment.reasoning}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {suggestion.action === 'seat_immediately' && suggestion.partyId && (
                        <Button
                          size="sm"
                          onClick={() => applySuggestionMutation.mutate({
                            suggestionId: index,
                            partyId: suggestion.partyId,
                            tableAssignment: suggestion.tableAssignment
                          })}
                          disabled={applySuggestionMutation.isPending}
                        >
                          {applySuggestionMutation.isPending ? 'Applying...' : 'Apply'}
                        </Button>
                      )}
                    </div>
                    
                    {suggestion.confidence >= 80 && (
                      <Progress value={suggestion.confidence} className="mt-2 h-2" />
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  No optimization suggestions at the moment. The AI is monitoring your waitlist for opportunities.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Demand Predictions Tab */}
          <TabsContent value="predictions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Upcoming Demand Forecast</h3>
              <Badge variant="outline">Next 4 hours</Badge>
            </div>

            {predictionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : predictionsData?.predictions?.length > 0 ? (
              <div className="space-y-3">
                {predictionsData.predictions.map((prediction: DemandPrediction, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{prediction.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={prediction.predictedWaitTime > 30 ? 'destructive' : 
                                 prediction.predictedWaitTime > 15 ? 'default' : 'secondary'}
                        >
                          {prediction.predictedWaitTime}min wait
                        </Badge>
                        <Badge variant="outline">
                          {prediction.predictedPartySize} avg party size
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">Confidence:</span>
                      <Progress value={prediction.confidenceLevel} className="h-2 flex-1" />
                      <span className="text-sm font-medium">{prediction.confidenceLevel}%</span>
                    </div>

                    {prediction.factors.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Factors: </span>
                        {prediction.factors.join(', ')}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Building demand predictions... More data needed for accurate forecasting.
                </AlertDescription>
              </Alert>
            )}

            {/* Capacity Recommendations */}
            {predictionsData?.recommendations?.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Capacity Recommendations</h4>
                {predictionsData.recommendations.map((rec: CapacityRecommendation, index: number) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <div>
                        <Badge className={`mr-2 ${getPriorityColor(rec.priority)}`}>
                          {rec.priority.toUpperCase()}
                        </Badge>
                        {rec.reasoning}
                      </div>
                      <Badge variant="outline">+{rec.impact}min impact</Badge>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="font-semibold">AI Performance</span>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Suggestions applied today:</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average wait time reduction:</span>
                    <span className="font-medium text-green-600">-18 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Table utilization improvement:</span>
                    <span className="font-medium text-blue-600">+23%</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Learning Status</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Pattern Recognition</span>
                    <Progress value={85} className="w-24 h-2" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Demand Prediction</span>
                    <Progress value={72} className="w-24 h-2" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Optimization Accuracy</span>
                    <Progress value={91} className="w-24 h-2" />
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}