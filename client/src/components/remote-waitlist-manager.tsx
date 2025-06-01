import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { WaitlistEntry, Restaurant } from '@shared/schema';
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, X, Users, UserCheck, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, isAfter, addMinutes, parseISO } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface RemoteWaitlistManagerProps {
  restaurant: Restaurant;
}

export const RemoteWaitlistManager = ({ restaurant }: RemoteWaitlistManagerProps) => {
  const queryClient = useQueryClient();
  const [autoProcessing, setAutoProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('remote');
  const [prioritizePhysical, setPrioritizePhysical] = useState(true);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  
  // Get all waitlist entries for this restaurant
  const { data: allWaitlistEntries, isLoading, error } = useQuery({
    queryKey: ['/api/restaurants', restaurant.id, 'waitlist'],
    queryFn: async () => {
      const response = await apiRequest(`/api/restaurants/${restaurant.id}/waitlist`);
      return await response.json();
    }
  });
  
  // Filter entries based on the active tab
  const waitlistEntries = allWaitlistEntries ? allWaitlistEntries.filter((entry: WaitlistEntry) => {
    if (activeTab === 'remote') {
      return entry.isRemote && (entry.status === 'remote_pending' || entry.status === 'remote_confirmed');
    } else if (activeTab === 'physical') {
      return !entry.isRemote && entry.status === 'waiting';
    } else if (activeTab === 'all') {
      return true;
    }
    return false;
  }) : [];
  
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

  // Mutation to check in remote customers with confirmation code
  const checkInMutation = useMutation({
    mutationFn: async ({ confirmationCode }: { confirmationCode: string }) => {
      const response = await apiRequest({
        url: `/api/restaurants/${restaurant.id}/remote-waitlist/checkin`,
        method: 'POST',
        body: { confirmationCode }
      });
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate query to refresh waitlist
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', restaurant.id, 'waitlist'] });
      setCheckInDialogOpen(false);
      setConfirmationCode('');
      setSelectedEntry(null);
      toast({
        title: 'Success',
        description: 'Customer checked in successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Invalid confirmation code',
        variant: 'destructive',
      });
    },
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
  
  // Calculate table availability status
  const getAvailableTableCount = () => {
    // In a full implementation, this would query table availability
    // For demo purposes, we'll assume a standard count
    return 4;
  };
  
  // Process next customer based on priority rules
  const processNextCustomer = () => {
    try {
      let nextCustomer = null;
      
      // Prioritize physically present customers if enabled
      if (prioritizePhysical) {
        // First check for physical customers waiting
        const physicalEntries = allWaitlistEntries.filter((entry: WaitlistEntry) => 
          !entry.isRemote && entry.status === 'waiting'
        );
        
        if (physicalEntries.length > 0) {
          // Sort by creation time (first in, first out)
          physicalEntries.sort((a: WaitlistEntry, b: WaitlistEntry) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return aTime - bTime;
          });
          
          nextCustomer = physicalEntries[0];
          updateEntryMutation.mutate({ 
            entryId: nextCustomer.id, 
            status: 'processing' 
          });
          
          toast({
            title: 'Processing Next Customer',
            description: `Physical customer ${nextCustomer.customerName} is being processed.`,
          });
          return;
        }
      }
      
      // If no physical entries or not prioritizing, check for remote entries
      const remoteEntries = allWaitlistEntries.filter((entry: WaitlistEntry) => 
        entry.isRemote && (entry.status === 'remote_confirmed')
      );
      
      if (remoteEntries.length > 0) {
        // Sort by original queue position
        remoteEntries.sort((a: WaitlistEntry, b: WaitlistEntry) => 
          a.queuePosition - b.queuePosition
        );
        
        nextCustomer = remoteEntries[0];
        updateEntryMutation.mutate({ 
          entryId: nextCustomer.id, 
          status: 'processing' 
        });
        
        toast({
          title: 'Processing Next Customer',
          description: `Remote customer ${nextCustomer.customerName} is being processed.`,
        });
        return;
      }
      
      // If we haven't returned yet, no customers available
      toast({
        title: 'No Customers Waiting',
        description: 'There are no customers ready to be seated at this time.',
      });
      
    } catch (error) {
      console.error('Error processing next customer:', error);
      toast({
        title: 'Processing Failed',
        description: 'An error occurred while processing the next customer.',
        variant: 'destructive',
      });
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
  
  // Early return for loading state
  if (isLoading) {
    return <div className="p-4 text-center">Loading waitlist entries...</div>;
  }
  
  // Early return for error state
  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error loading waitlist entries
      </div>
    );
  }
  
  // Initialize tab count states
  const remoteCount = allWaitlistEntries ? allWaitlistEntries.filter((entry: WaitlistEntry) => 
    entry.isRemote && (entry.status === 'remote_pending' || entry.status === 'remote_confirmed')
  ).length : 0;
  
  const physicalCount = allWaitlistEntries ? allWaitlistEntries.filter((entry: WaitlistEntry) => 
    !entry.isRemote && entry.status === 'waiting'
  ).length : 0;
  
  const hasExpiredEntries = allWaitlistEntries ? allWaitlistEntries.some((entry: WaitlistEntry) => 
    entry.isRemote && entry.status === 'remote_pending' && 
    entry.expectedArrivalTime && isEntryLate(entry.expectedArrivalTime)
  ) : false;
  
  const availableTables = getAvailableTableCount();
  
  // If no entries in any category
  if (!allWaitlistEntries || allWaitlistEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Waitlist Manager</CardTitle>
          <CardDescription>Manage customers in your waitlist queue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6 text-muted-foreground">
            No waitlist entries at this time
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-center">
          <CardTitle>Waitlist Manager</CardTitle>
          <div className="flex items-center gap-4">
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
            
            <Button 
              onClick={processNextCustomer}
              variant="default"
              size="sm"
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Seat Next Customer
            </Button>
          </div>
        </div>
        <CardDescription>Manage in-person and remote customers</CardDescription>
      </CardHeader>
      
      <div className="px-6 pb-2 flex items-center gap-2">
        <div className="flex items-center space-x-2">
          <Switch 
            id="prioritize" 
            checked={prioritizePhysical}
            onCheckedChange={setPrioritizePhysical}
          />
          <Label htmlFor="prioritize">Prioritize physically present customers</Label>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <AlertTriangle className="h-4 w-4 text-amber-500 ml-2" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                When enabled, customers physically present at the restaurant will be seated before 
                remote customers, even if the remote customers joined the waitlist earlier.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <CardContent>
        <Tabs defaultValue="remote" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="remote" className="relative">
              Remote
              {remoteCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {remoteCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="physical" className="relative">
              Physical
              {physicalCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {physicalCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All Entries</TabsTrigger>
          </TabsList>
          
          <div className="mb-4">
            <div className="p-3 bg-muted rounded-lg flex justify-between items-center">
              <div>
                <span className="text-sm font-medium">Available Tables:</span>
                <span className="ml-2 font-bold">{availableTables}</span>
              </div>
              <div>
                <span className="text-sm font-medium">Current Policy:</span>
                <span className="ml-2 font-medium text-primary">
                  {prioritizePhysical ? 'Physical First' : 'First Come, First Served'}
                </span>
              </div>
            </div>
          </div>
          
          {waitlistEntries.length === 0 ? (
            <div className="text-center p-10 border rounded-md">
              <p className="text-muted-foreground">No entries in this category</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Party Size</TableHead>
                    {activeTab === 'remote' && <TableHead>Expected Arrival</TableHead>}
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
                      
                      {activeTab === 'remote' && (
                        <TableCell>
                          <div className="flex items-center">
                            {entry.expectedArrivalTime ? (
                              <>
                                {formatTime(String(entry.expectedArrivalTime))}
                                {isEntryLate(String(entry.expectedArrivalTime)) && (
                                  <AlertCircle className="ml-2 h-4 w-4 text-amber-500" />
                                )}
                              </>
                            ) : (
                              'Not specified'
                            )}
                          </div>
                        </TableCell>
                      )}
                      
                      <TableCell>
                        {entry.isRemote ? (
                          <Badge variant={entry.status === 'remote_pending' ? 'secondary' : 'outline'}>
                            {entry.status === 'remote_pending' ? 'Pending Arrival' : 'Confirmed En Route'}
                          </Badge>
                        ) : (
                          <Badge variant="default">In Person</Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>{entry.phoneNumber || 'None'}</TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {entry.status !== 'processing' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-green-500"
                              onClick={() => updateEntryMutation.mutate({ 
                                entryId: entry.id, 
                                status: 'processing' 
                              })}
                            >
                              <UserCheck className="h-4 w-4" />
                              <span className="sr-only">Process</span>
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500"
                            onClick={() => handleCancel(entry.id)}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Cancel</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex flex-col border-t pt-4">
        <div className="w-full text-sm text-muted-foreground">
          <p className="mb-2 font-medium">Queue Management Policy:</p>
          <p>• Remote customers maintain their original queue position upon physical check-in</p>
          <p>• Remote entries are automatically cancelled if 15 minutes late</p>
          {prioritizePhysical && (
            <p className="text-primary">• Currently prioritizing physically present customers</p>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default RemoteWaitlistManager;