import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Restaurant, WaitStatus } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import GoogleMap from "@/components/ui/google-map";
import { useToast } from "@/hooks/use-toast";
import { QRCodeGenerator } from "@/components/ui/qr-code-generator";
import WaitlistManagement from "@/components/waitlist-management";
import RemoteWaitlistManager from "@/components/remote-waitlist-manager";
import TableTypeManager from "@/components/table-type-manager";
import { TurnoverAnalysis } from "@/components/turnover-analysis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock restaurant ID for demo - in a real app, this would come from authentication
const RESTAURANT_ID = 4;

const RestaurantDashboard = () => {
  const { toast } = useToast();
  const [customWaitTime, setCustomWaitTime] = useState(15);
  const [partySize, setPartySize] = useState("Any size");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch restaurant data
  const { data: restaurant, isLoading } = useQuery<Restaurant>({
    queryKey: [`/api/restaurants/${RESTAURANT_ID}`],
  });
  
  // Update wait time mutation
  const updateWaitTime = useMutation({
    mutationFn: async ({ status, customTime }: { status: WaitStatus, customTime?: number }) => {
      return await apiRequest({
        url: `/api/restaurants/${RESTAURANT_ID}/wait-time`,
        method: "POST",
        body: { status, customTime }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${RESTAURANT_ID}`] });
      toast({
        title: "Wait time updated",
        description: "Your restaurant's wait time has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update wait time: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  });
  
  // Update restaurant info mutation
  const updateRestaurant = useMutation({
    mutationFn: async (data: Partial<Restaurant>) => {
      return await apiRequest({
        url: `/api/restaurants/${RESTAURANT_ID}`,
        method: "PATCH",
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${RESTAURANT_ID}`] });
      toast({
        title: "Restaurant updated",
        description: "Your restaurant information has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update restaurant: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleWaitStatusChange = (status: WaitStatus) => {
    if (status === restaurant?.currentWaitStatus) return;
    
    updateWaitTime.mutate({ 
      status, 
      customTime: status === 'available' ? 0 : (status === 'short' ? customWaitTime : customWaitTime * 2)
    });
  };
  
  const handleCustomWaitTimeUpdate = () => {
    if (!restaurant) return;
    
    updateWaitTime.mutate({ 
      status: restaurant.currentWaitStatus as WaitStatus, 
      customTime: customWaitTime
    });
  };
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
        {/* Loading skeleton for the rest of the content */}
      </div>
    );
  }
  
  if (!restaurant) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold font-heading mb-4">Restaurant Not Found</h2>
        <p>Please sign in to access your restaurant dashboard.</p>
      </div>
    );
  }
  
  const operatingHours = restaurant.operatingHours as any;
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold font-heading mb-1">Restaurant Dashboard</h2>
          <p className="text-gray-600">Update your wait times and manage your restaurant profile</p>
        </div>
        <div className="mt-4 md:mt-0">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
            Open Now
          </span>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 gap-1 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="qrcode">QR Code</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          {/* Current Status Card */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Current Wait Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Available Status */}
              <div 
                className={`bg-white rounded-lg p-4 ${
                  restaurant.currentWaitStatus === 'available' 
                    ? 'border-2 border-secondary shadow-sm'
                    : 'border border-gray-200 hover:shadow-sm cursor-pointer'
                } flex flex-col items-center`}
                onClick={() => handleWaitStatusChange('available')}
              >
                <div className="w-16 h-16 rounded-full bg-status-available flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-medium">Available</span>
                <span className="text-xs text-gray-500">No wait time</span>
              </div>
              
              {/* Short Wait Status */}
              <div 
                className={`bg-white rounded-lg p-4 ${
                  restaurant.currentWaitStatus === 'short' 
                    ? 'border-2 border-secondary shadow-sm'
                    : 'border border-gray-200 hover:shadow-sm cursor-pointer'
                } flex flex-col items-center`}
                onClick={() => handleWaitStatusChange('short')}
              >
                <div className="w-16 h-16 rounded-full bg-status-short flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-medium">Short Wait</span>
                <span className="text-xs text-gray-500">15-30 minutes</span>
              </div>
              
              {/* Long Wait Status */}
              <div 
                className={`bg-white rounded-lg p-4 ${
                  restaurant.currentWaitStatus === 'long' 
                    ? 'border-2 border-secondary shadow-sm'
                    : 'border border-gray-200 hover:shadow-sm cursor-pointer'
                } flex flex-col items-center`}
                onClick={() => handleWaitStatusChange('long')}
              >
                <div className="w-16 h-16 rounded-full bg-status-long flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 01-.043-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-medium">Long Wait</span>
                <span className="text-xs text-gray-500">30+ minutes</span>
              </div>
            </div>
          </div>

          {/* Custom Wait Time Setup */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Custom Wait Time</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow">
                <label htmlFor="wait-time" className="block text-sm font-medium text-gray-700 mb-1">Estimated wait time (minutes)</label>
                <input 
                  type="number" 
                  id="wait-time" 
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                  placeholder="Enter minutes" 
                  min="0" 
                  max="180" 
                  value={customWaitTime}
                  onChange={(e) => setCustomWaitTime(parseInt(e.target.value))}
                />
              </div>
              <div className="flex-grow">
                <label htmlFor="party-size" className="block text-sm font-medium text-gray-700 mb-1">For party size</label>
                <select 
                  id="party-size" 
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  value={partySize}
                  onChange={(e) => setPartySize(e.target.value)}
                >
                  <option>Any size</option>
                  <option>1-2 people</option>
                  <option>3-4 people</option>
                  <option>5+ people</option>
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors duration-200 font-medium shadow-sm w-full md:w-auto"
                  onClick={handleCustomWaitTimeUpdate}
                  disabled={updateWaitTime.isPending}
                >
                  {updateWaitTime.isPending ? 'Updating...' : 'Update Wait Time'}
                </button>
              </div>
            </div>
          </div>

          {/* Restaurant Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="col-span-2">
              <h3 className="text-lg font-semibold mb-4">Restaurant Information</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                    <input 
                      type="text" 
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                      value={restaurant.name}
                      onChange={(e) => updateRestaurant.mutate({ name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                      value={restaurant.phoneNumber || ""}
                      onChange={(e) => updateRestaurant.mutate({ phoneNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Type</label>
                    <select 
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      value={restaurant.cuisine}
                      onChange={(e) => updateRestaurant.mutate({ cuisine: e.target.value })}
                    >
                      <option>Seafood</option>
                      <option>Italian</option>
                      <option>American</option>
                      <option>Asian</option>
                      <option>Mexican</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                    <select 
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      value={restaurant.priceRange}
                      onChange={(e) => updateRestaurant.mutate({ priceRange: e.target.value })}
                    >
                      <option>$ (Under $10)</option>
                      <option>$$ ($11-$30)</option>
                      <option>$$$ ($31-$60)</option>
                      <option>$$$$ (Over $60)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea 
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                      rows={3}
                      value={restaurant.description || ""}
                      onChange={(e) => updateRestaurant.mutate({ description: e.target.value })}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Opening Hours</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-3">
                  {operatingHours && Object.entries(operatingHours).map(([day, hours]: [string, any]) => (
                    <div key={day} className="flex justify-between">
                      <span className="font-medium">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                      <span>{hours.open} - {hours.close}</span>
                    </div>
                  ))}
                  {!operatingHours && (
                    <p className="text-gray-500">No operating hours set.</p>
                  )}
                </div>
                <button className="mt-4 text-secondary hover:text-primary transition-colors text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit Hours
                </button>
              </div>
            </div>
          </div>

          {/* Google Maps Integration */}
          <h3 className="text-lg font-semibold mb-4">Location</h3>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input 
                type="text" 
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                value={restaurant.address}
                onChange={(e) => updateRestaurant.mutate({ address: e.target.value })}
              />
            </div>
            {/* Google Maps component */}
            <GoogleMap
              latitude={restaurant.latitude}
              longitude={restaurant.longitude}
              markerTitle={restaurant.name}
              className="mb-4"
            />
            <div className="flex justify-end">
              <button className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors duration-200 font-medium shadow-sm">
                Verify Location
              </button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="waitlist">
          <div className="space-y-8">
            <WaitlistManagement restaurantId={RESTAURANT_ID} />
            
            {/* Remote Waitlist Management Section */}
            {restaurant && <RemoteWaitlistManager restaurant={restaurant} />}
          </div>
        </TabsContent>
        
        <TabsContent value="tables">
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Table Management</h3>
            <p className="text-gray-600 mb-6">Manage your restaurant's table types and optimize queue management based on party sizes.</p>
            
            <div className="mb-8">
              <h4 className="text-md font-semibold mb-3">Advanced Queue Settings</h4>
              <div className="flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={restaurant.useAdvancedQueue || false}
                    onChange={(e) => updateRestaurant.mutate({ useAdvancedQueue: e.target.checked })}
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  <span className="ms-3 text-sm font-medium text-gray-900">Enable Advanced Queue Management</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">When enabled, the system will automatically match customers to appropriate tables based on party size.</p>
            </div>
            
            <TableTypeManager restaurantId={RESTAURANT_ID} />
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm mb-6">
              <h4 className="font-medium text-yellow-800 mb-1">Table Type Tips</h4>
              <ul className="list-disc list-inside text-yellow-700 space-y-1">
                <li>Create different table types based on seating capacity and location (indoor, outdoor, etc.)</li>
                <li>Set accurate turnover times to improve wait time predictions</li>
                <li>More specific table types lead to better customer matching and shorter wait times</li>
              </ul>
            </div>
            
            <h3 className="text-lg font-semibold mb-4">Turnover Time Analytics</h3>
            <TurnoverAnalysis restaurantId={RESTAURANT_ID} />
          </div>
        </TabsContent>
        
        <TabsContent value="qrcode">
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">QR Code Generator</h3>
            <p className="mb-4 text-gray-600">
              Generate a QR code for your restaurant that customers can scan to join your waitlist.
              Place this QR code on your restaurant window or at the entrance.
            </p>
            <ol className="list-decimal ml-5 mb-4 space-y-2 text-gray-600">
              <li>Generate the QR code using the tool below</li>
              <li>Download and print the QR code</li>
              <li>Place it in a visible spot for customers</li>
              <li>When scanned, customers will be able to join your waitlist</li>
            </ol>
          </div>
          
          {restaurant && (
            <QRCodeGenerator restaurantId={RESTAURANT_ID} restaurantName={restaurant.name} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RestaurantDashboard;