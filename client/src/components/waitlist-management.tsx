import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import type { WaitlistEntry } from '@shared/schema';

interface WaitlistManagementProps {
  restaurantId: number;
}

export const WaitlistManagement = ({ restaurantId }: WaitlistManagementProps) => {
  const [activeTab, setActiveTab] = useState('waiting');
  const queryClient = useQueryClient();

  // Fetch waitlist entries for this restaurant
  const { data: waitlistEntries, isLoading, error } = useQuery({
    queryKey: ['/api/restaurants', restaurantId, 'waitlist'],
    queryFn: async () => {
      const response = await apiRequest(`/api/restaurants/${restaurantId}/waitlist`);
      return response.json();
    },
  });

  // Mutation to update waitlist entry status
  const updateEntryMutation = useMutation({
    mutationFn: async ({ entryId, status }: { entryId: number; status: string }) => {
      const response = await apiRequest({
        url: `/api/restaurants/${restaurantId}/waitlist/${entryId}`,
        method: 'PATCH',
        body: { status }
      });
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate query to refresh waitlist
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', restaurantId, 'waitlist'] });
      toast({
        title: 'Success',
        description: 'Waitlist entry status updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update entry status',
        variant: 'destructive',
      });
    },
  });

  const handleNotifyCustomer = (entryId: number) => {
    updateEntryMutation.mutate({ entryId, status: 'notified' });
  };

  const handleSeatCustomer = (entryId: number) => {
    updateEntryMutation.mutate({ entryId, status: 'seated' });
  };

  const handleCancelEntry = (entryId: number) => {
    if (confirm('Are you sure you want to remove this customer from the waitlist?')) {
      updateEntryMutation.mutate({ entryId, status: 'cancelled' });
    }
  };

  // Filter entries based on active tab
  const getFilteredEntries = () => {
    if (!waitlistEntries) return [];
    
    if (activeTab === 'waiting') {
      return waitlistEntries.filter((entry: WaitlistEntry) => 
        entry.status === 'waiting' || entry.status === 'notified'
      );
    } else if (activeTab === 'seated') {
      return waitlistEntries.filter((entry: WaitlistEntry) => 
        entry.status === 'seated'
      );
    } else if (activeTab === 'cancelled') {
      return waitlistEntries.filter((entry: WaitlistEntry) => 
        entry.status === 'cancelled'
      );
    }
    
    return waitlistEntries;
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="outline">Waiting</Badge>;
      case 'notified':
        return <Badge variant="secondary">Notified</Badge>;
      case 'seated':
        return <Badge variant="secondary" className="bg-green-500 hover:bg-green-600 text-white">Seated</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'Unknown';
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading waitlist...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        Error loading waitlist: {(error as Error).message}
      </div>
    );
  }

  const filteredEntries = getFilteredEntries();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Waitlist Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="waiting" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="w-full mb-4">
            <TabsTrigger value="waiting" className="flex-1">
              Waiting
              {waitlistEntries && (
                <Badge variant="secondary" className="ml-2">
                  {waitlistEntries.filter((e: WaitlistEntry) => 
                    e.status === 'waiting' || e.status === 'notified'
                  ).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="seated" className="flex-1">Seated</TabsTrigger>
            <TabsTrigger value="cancelled" className="flex-1">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {filteredEntries.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-md">
                No {activeTab} customers at the moment
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Position</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Party Size</TableHead>
                      <TableHead>Wait Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry: WaitlistEntry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.queuePosition || '-'}</TableCell>
                        <TableCell className="font-medium">
                          {entry.customerName}
                          {entry.phoneNumber && (
                            <div className="text-xs text-muted-foreground">
                              {entry.phoneNumber}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{entry.partySize}</TableCell>
                        <TableCell>{entry.estimatedWaitTime} min</TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                        <TableCell>{formatTime(entry.createdAt.toString())}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {(entry.status === 'waiting') && (
                              <Button 
                                size="sm" 
                                onClick={() => handleNotifyCustomer(entry.id)}
                                variant="outline"
                              >
                                Notify
                              </Button>
                            )}
                            {(entry.status === 'waiting' || entry.status === 'notified') && (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleSeatCustomer(entry.id)}
                                >
                                  Seat
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleCancelEntry(entry.id)}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WaitlistManagement;