import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { WaitlistEntry, Restaurant } from '@shared/schema';
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, isAfter, addMinutes } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RemoteWaitlistManagerProps {
  restaurant: Restaurant;
}

export const RemoteWaitlistManager = ({ restaurant }: RemoteWaitlistManagerProps) => {
  const queryClient = useQueryClient();
  const [autoProcessing, setAutoProcessing] = useState(false);
  
  // Get the remote waitlist entries for this restaurant
  const { data: waitlistEntries, isLoading, error } = useQuery({
    queryKey: ['/api/restaurants', restaurant.id, 'waitlist'],
    queryFn: async () => {
      const response = await apiRequest(`/api/restaurants/${restaurant.id}/waitlist`);
      const allEntries = await response.json();
      // Filter for only remote entries with pending or confirmed status
      return allEntries.filter((entry: WaitlistEntry) => 
        entry.isRemote && (entry.status === 'remote_pending' || entry.status === 'remote_confirmed')
      );
    }
  });
  
  // Mutation to update waitlist entry status
  const updateEntryMutation = useMutation({
    mutationFn: async ({ entryId, status }: { entryId: number, status: string }) => {
      const response = await apiRequest({
        url: `/api/restaurants/${restaurant.id}/waitlist/${entryId}`,
        method: 'PATCH',
        body: { status }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', restaurant.id, 'waitlist'] });
      toast({
        title: 'Updated successfully',
        description: 'The waitlist entry has been updated.',
      });
    },
    onError: () => {
      toast({
        title: 'Update failed',
        description: 'Failed to update the waitlist entry.',
        variant: 'destructive',
      });
    }
  });
  
  // Auto-process entries that are past the 15-minute grace period
  const processExpiredEntries = () => {
    setAutoProcessing(true);
    
    try {
      let cancelledCount = 0;
      
      waitlistEntries.forEach((entry: WaitlistEntry) => {
        if (entry.status === 'remote_pending' && entry.expectedArrivalTime) {
          const expectedTime = new Date(entry.expectedArrivalTime);
          const graceWindow = addMinutes(expectedTime, 15);
          
          if (isAfter(new Date(), graceWindow)) {
            updateEntryMutation.mutate({ 
              entryId: entry.id, 
              status: 'cancelled' 
            });
            cancelledCount++;
          }
        }
      });
      
      toast({
        title: 'Auto-processed entries',
        description: `${cancelledCount} expired remote entries were cancelled.`,
      });
    } catch (error) {
      console.error('Error auto-processing entries:', error);
      toast({
        title: 'Processing failed',
        description: 'An error occurred while processing expired entries.',
        variant: 'destructive',
      });
    } finally {
      setAutoProcessing(false);
    }
  };
  
  // Handle manual cancellation
  const handleCancel = (entryId: number) => {
    updateEntryMutation.mutate({ entryId, status: 'cancelled' });
  };
  
  // Format the expected arrival time
  const formatTime = (timestamp: string | Date) => {
    try {
      const dateObj = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      return format(dateObj, 'MMM d, h:mm a');
    } catch (e) {
      return 'Invalid time';
    }
  };
  
  // Calculate if entry is late (past the 15-minute grace period)
  const isEntryLate = (expectedArrivalTime: string | Date) => {
    try {
      const expectedTime = typeof expectedArrivalTime === 'string' 
        ? new Date(expectedArrivalTime) 
        : expectedArrivalTime;
      const graceWindow = addMinutes(expectedTime, 15);
      return isAfter(new Date(), graceWindow);
    } catch (e) {
      return false;
    }
  };
  
  if (isLoading) {
    return <div className="p-4 text-center">Loading remote waitlist entries...</div>;
  }
  
  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error loading remote waitlist entries
      </div>
    );
  }
  
  if (!waitlistEntries || waitlistEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Remote Waitlist</CardTitle>
          <CardDescription>Manage customers who joined your waitlist remotely</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6 text-muted-foreground">
            No remote waitlist entries at this time
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const hasExpiredEntries = waitlistEntries.some((entry: WaitlistEntry) => 
    entry.status === 'remote_pending' && entry.expectedArrivalTime && isEntryLate(entry.expectedArrivalTime)
  );
  
  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-center">
          <CardTitle>Remote Waitlist</CardTitle>
          {hasExpiredEntries && (
            <Button 
              onClick={processExpiredEntries} 
              disabled={autoProcessing}
              variant="outline"
              size="sm"
            >
              {autoProcessing ? (
                <>Processing...</>
              ) : (
                <>Cancel Expired Entries <Clock className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          )}
        </div>
        <CardDescription>Manage customers who joined your waitlist remotely</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Party Size</TableHead>
                <TableHead>Expected Arrival</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {waitlistEntries.map((entry: WaitlistEntry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.customerName}</TableCell>
                  <TableCell>{entry.partySize}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {entry.expectedArrivalTime ? (
                        <>
                          {formatTime(entry.expectedArrivalTime)}
                          {isEntryLate(entry.expectedArrivalTime) && (
                            <AlertCircle className="ml-2 h-4 w-4 text-amber-500" />
                          )}
                        </>
                      ) : (
                        'Not specified'
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.status === 'remote_pending' ? 'secondary' : 'outline'}>
                      {entry.status === 'remote_pending' ? 'Pending Arrival' : 'Confirmed En Route'}
                    </Badge>
                  </TableCell>
                  <TableCell>{entry.phoneNumber || 'None'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500"
                      onClick={() => handleCancel(entry.id)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Cancel</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RemoteWaitlistManager;