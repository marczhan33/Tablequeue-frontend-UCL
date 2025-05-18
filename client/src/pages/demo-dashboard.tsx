import { useState } from "react";
import { WaitStatus } from "@shared/schema";
import GoogleMap from "@/components/ui/google-map";
import { DemandForecastDisplay } from "@/components/restaurant/demand-forecast-display";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RestaurantPromoManager } from "@/components/restaurant-promo-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, Clock3, UserRound, Calendar, ArrowRight, QrCode, Sparkles } from "lucide-react";
import { Link } from "wouter";

// Demo restaurant data
const DEMO_RESTAURANT = {
  id: 1,
  name: "Italian Bistro Demo",
  address: "123 Main St, San Francisco, CA 94105",
  description: "Authentic Italian cuisine in a relaxed atmosphere",
  cuisine: "Italian",
  priceRange: "$$",
  phoneNumber: "(415) 555-1234",
  currentWaitStatus: "short" as WaitStatus,
  customWaitTime: 20,
  latitude: "37.7749",
  longitude: "-122.4194",
  averageTurnoverTime: 45,
  capacity: 80,
  useAdvancedQueue: true,
  tableTypes: [
    { id: 1, name: "Small Table", capacity: 2, count: 10, averageTurnoverTime: 45 },
    { id: 2, name: "Medium Table", capacity: 4, count: 8, averageTurnoverTime: 60 },
    { id: 3, name: "Large Table", capacity: 6, count: 5, averageTurnoverTime: 75 },
    { id: 4, name: "Booth", capacity: 4, count: 6, averageTurnoverTime: 70 }
  ],
  operatingHours: [
    { day: "Monday", hours: "11:00 AM - 9:00 PM" },
    { day: "Tuesday", hours: "11:00 AM - 9:00 PM" },
    { day: "Wednesday", hours: "11:00 AM - 9:00 PM" },
    { day: "Thursday", hours: "11:00 AM - 9:00 PM" },
    { day: "Friday", hours: "11:00 AM - 10:00 PM" },
    { day: "Saturday", hours: "10:00 AM - 10:00 PM" },
    { day: "Sunday", hours: "10:00 AM - 9:00 PM" }
  ]
};

// Demo waitlist entries
const DEMO_WAITLIST = [
  { id: 101, customerName: "Michael Brown", partySize: 2, status: "waiting", estimatedWaitTime: 15, joinedAt: new Date(Date.now() - 5 * 60000) },
  { id: 102, customerName: "Jessica Lee", partySize: 4, status: "waiting", estimatedWaitTime: 25, joinedAt: new Date(Date.now() - 12 * 60000) },
  { id: 103, customerName: "David Kim", partySize: 3, status: "notified", estimatedWaitTime: 5, joinedAt: new Date(Date.now() - 20 * 60000) },
  { id: 104, customerName: "Sarah Johnson", partySize: 2, status: "waiting", estimatedWaitTime: 15, joinedAt: new Date(Date.now() - 8 * 60000) },
  { id: 105, customerName: "Robert Taylor", partySize: 6, status: "seated", estimatedWaitTime: 30, joinedAt: new Date(Date.now() - 35 * 60000) }
];

// Demo remote waitlist entries
const DEMO_REMOTE_WAITLIST = [
  { id: 201, customerName: "Emily Wilson", partySize: 2, status: "confirmed", estimatedArrival: "5:30 PM", phoneNumber: "415-555-6789" },
  { id: 202, customerName: "James Martin", partySize: 4, status: "pending", estimatedArrival: "6:00 PM", phoneNumber: "415-555-7890" }
];

const DemoDashboard = () => {
  const { toast } = useToast();
  const [customWaitTime, setCustomWaitTime] = useState(20);
  const [partySize, setPartySize] = useState("Any size");
  const [activeTab, setActiveTab] = useState("overview");
  
  const handleWaitStatusChange = (status: WaitStatus) => {
    toast({
      title: "Demo Mode",
      description: "In a real account, this would update your restaurant's wait status.",
    });
  };
  
  const handleCustomWaitTimeUpdate = () => {
    toast({
      title: "Demo Mode",
      description: "In a real account, this would update your custom wait time.",
    });
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading mb-1">{DEMO_RESTAURANT.name}</h1>
            <p className="text-gray-600">{DEMO_RESTAURANT.address}</p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
            <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-200 bg-green-50">
              <Clock3 className="h-3.5 w-3.5" />
              <span>Demo Account</span>
            </Badge>
            
            <Link href="/auth">
              <Button className="whitespace-nowrap" size="sm">
                <span>Sign Up for Real Account</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <UserRound className="mr-2 h-5 w-5 text-primary" />
                Current Waitlist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{DEMO_WAITLIST.filter(e => e.status === 'waiting' || e.status === 'notified').length}</div>
              <p className="text-muted-foreground text-sm">Parties waiting</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Clock className="mr-2 h-5 w-5 text-primary" />
                Average Wait Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{DEMO_RESTAURANT.customWaitTime} min</div>
              <p className="text-muted-foreground text-sm">Current estimated wait</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                Remote Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{DEMO_REMOTE_WAITLIST.length}</div>
              <p className="text-muted-foreground text-sm">Remote check-ins today</p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-6 gap-1 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="optimization">Wait Optimization</TabsTrigger>
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
                  DEMO_RESTAURANT.currentWaitStatus === 'available' 
                    ? 'border-2 border-green-500 shadow-sm'
                    : 'border border-gray-200 hover:shadow-sm cursor-pointer'
                } flex flex-col items-center`}
                onClick={() => handleWaitStatusChange('available')}
              >
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-medium">Available</span>
                <span className="text-xs text-gray-500">No wait</span>
              </div>
              
              {/* Short Wait Status */}
              <div 
                className={`bg-white rounded-lg p-4 ${
                  DEMO_RESTAURANT.currentWaitStatus === 'short' 
                    ? 'border-2 border-secondary shadow-sm'
                    : 'border border-gray-200 hover:shadow-sm cursor-pointer'
                } flex flex-col items-center`}
                onClick={() => handleWaitStatusChange('short')}
              >
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-medium">Short Wait</span>
                <span className="text-xs text-gray-500">15-30 minutes</span>
              </div>
              
              {/* Long Wait Status */}
              <div 
                className={`bg-white rounded-lg p-4 ${
                  DEMO_RESTAURANT.currentWaitStatus === 'long' 
                    ? 'border-2 border-secondary shadow-sm'
                    : 'border border-gray-200 hover:shadow-sm cursor-pointer'
                } flex flex-col items-center`}
                onClick={() => handleWaitStatusChange('long')}
              >
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
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
                  <option>5-6 people</option>
                  <option>7+ people</option>
                </select>
              </div>
              <div className="flex-shrink-0 flex items-end">
                <button 
                  className="w-full md:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors duration-200 font-medium"
                  onClick={handleCustomWaitTimeUpdate}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Restaurant Information</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                  <input 
                    type="text" 
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                    value={DEMO_RESTAURANT.name}
                    disabled
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input 
                    type="text" 
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                    value={DEMO_RESTAURANT.address}
                    disabled
                  />
                </div>
                
                <GoogleMap
                  latitude={DEMO_RESTAURANT.latitude}
                  longitude={DEMO_RESTAURANT.longitude}
                  markerTitle={DEMO_RESTAURANT.name}
                  className="mb-4"
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Operating Hours</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <ul className="space-y-3">
                  {DEMO_RESTAURANT.operatingHours.map((day, index) => (
                    <li key={index} className="flex justify-between">
                      <span className="font-medium">{day.day}</span>
                      <span>{day.hours}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="waitlist">
          <div className="space-y-8">
            {/* Waitlist - Desktop View (hidden on mobile) */}
            <div className="bg-gray-50 rounded-lg p-6 hidden md:block">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Current Waitlist</h3>
                <Button variant="outline" size="sm" onClick={() => toast({ title: "Demo Mode", description: "In a real account, this would add a new party to the waitlist." })}>
                  Add Party
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Size</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wait Time</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th scope="col" className="relative px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {DEMO_WAITLIST.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.customerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.partySize}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            entry.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' : 
                            entry.status === 'notified' ? 'bg-blue-100 text-blue-800' : 
                            entry.status === 'seated' ? 'bg-green-100 text-green-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.estimatedWaitTime} min</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.joinedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-primary hover:text-primary-dark" onClick={() => toast({ title: "Demo Mode", description: "In a real account, you could manage this waitlist entry." })}>
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Waitlist - Mobile View (visible only on mobile) */}
            <div className="bg-gray-50 rounded-lg p-4 md:hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Current Waitlist</h3>
                <Button variant="outline" size="sm" onClick={() => toast({ title: "Demo Mode", description: "In a real account, this would add a new party to the waitlist." })}>
                  Add Party
                </Button>
              </div>
              
              <div className="space-y-4">
                {DEMO_WAITLIST.map((entry) => (
                  <div key={entry.id} className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{entry.customerName}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' : 
                        entry.status === 'notified' ? 'bg-blue-100 text-blue-800' : 
                        entry.status === 'seated' ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 text-sm text-gray-600">
                      <div>Party Size:</div>
                      <div>{entry.partySize}</div>
                      <div>Wait Time:</div>
                      <div>{entry.estimatedWaitTime} min</div>
                      <div>Joined:</div>
                      <div>{entry.joinedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div className="mt-2 text-right">
                      <button className="text-primary hover:text-primary-dark text-sm font-medium" 
                        onClick={() => toast({ title: "Demo Mode", description: "In a real account, you could manage this waitlist entry." })}>
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Remote Queue - Desktop View (hidden on mobile) */}
            <div className="bg-gray-50 rounded-lg p-6 hidden md:block">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Remote Queue</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Size</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Arrival</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th scope="col" className="relative px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {DEMO_REMOTE_WAITLIST.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.customerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.partySize}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            entry.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.estimatedArrival}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.phoneNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-primary hover:text-primary-dark" onClick={() => toast({ title: "Demo Mode", description: "In a real account, you could manage this remote entry." })}>
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Remote Queue - Mobile View (visible only on mobile) */}
            <div className="bg-gray-50 rounded-lg p-4 md:hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Remote Queue</h3>
              </div>
              
              <div className="space-y-4">
                {DEMO_REMOTE_WAITLIST.map((entry) => (
                  <div key={entry.id} className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{entry.customerName}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 text-sm text-gray-600">
                      <div>Party Size:</div>
                      <div>{entry.partySize}</div>
                      <div>Arrival:</div>
                      <div>{entry.estimatedArrival}</div>
                      <div>Phone:</div>
                      <div>{entry.phoneNumber}</div>
                    </div>
                    <div className="mt-2 text-right">
                      <button className="text-primary hover:text-primary-dark text-sm font-medium" 
                        onClick={() => toast({ title: "Demo Mode", description: "In a real account, you could manage this remote entry." })}>
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="tables">
          <div className="mt-8 md:mt-0">
            {/* Desktop view */}
            <div className="hidden md:block">
              <div className="bg-white rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Table Management</h3>
                <p className="text-gray-600 mb-6">Manage your restaurant's table types and optimize queue management based on party sizes.</p>
                
                <div className="mb-8">
                  <h4 className="text-md font-semibold mb-3">Advanced Queue Settings</h4>
                  <div className="flex items-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={DEMO_RESTAURANT.useAdvancedQueue}
                        disabled
                      />
                      <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ms-3 text-sm font-medium text-gray-900">Enable Advanced Queue Management</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">When enabled, the system will automatically match customers to appropriate tables based on party size.</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Turnover</th>
                        <th scope="col" className="relative px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {DEMO_RESTAURANT.tableTypes.map((tableType) => (
                        <tr key={tableType.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tableType.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tableType.capacity} people</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tableType.count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tableType.averageTurnoverTime} minutes</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-primary hover:text-primary-dark" onClick={() => toast({ title: "Demo Mode", description: "In a real account, you could edit this table type." })}>
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" onClick={() => toast({ title: "Demo Mode", description: "In a real account, you could add a new table type." })}>
                    Add Table Type
                  </Button>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm mt-6">
                <h4 className="font-medium text-yellow-800 mb-1">Table Type Tips</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>Create different table types based on seating capacity and location (indoor, outdoor, etc.)</li>
                  <li>Set accurate turnover times to improve wait time predictions</li>
                  <li>More specific table types lead to better customer matching and shorter wait times</li>
                </ul>
              </div>
            </div>
            
            {/* Mobile view */}
            <div className="md:hidden">
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold mb-4">Table Management</h3>
                <p className="text-gray-600 mb-4">Manage your restaurant's table types and optimize queue management based on party sizes.</p>
                
                <div className="mb-6">
                  <h4 className="text-md font-semibold mb-2">Advanced Queue Settings</h4>
                  <div className="flex items-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={DEMO_RESTAURANT.useAdvancedQueue}
                        disabled
                      />
                      <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ms-3 text-sm font-medium text-gray-900">Enable Advanced Queue Management</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">When enabled, the system will automatically match customers to appropriate tables based on party size.</p>
                </div>
                
                <div className="space-y-4">
                  {DEMO_RESTAURANT.tableTypes.map((tableType) => (
                    <div key={tableType.id} className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-900">{tableType.name}</span>
                        <button className="text-primary hover:text-primary-dark text-sm font-medium" 
                          onClick={() => toast({ title: "Demo Mode", description: "In a real account, you could edit this table type." })}>
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 text-sm text-gray-600">
                        <div>Capacity:</div>
                        <div>{tableType.capacity} people</div>
                        <div>Count:</div>
                        <div>{tableType.count}</div>
                        <div>Avg. Turnover:</div>
                        <div>{tableType.averageTurnoverTime} minutes</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" onClick={() => toast({ title: "Demo Mode", description: "In a real account, you could add a new table type." })}>
                    Add Table Type
                  </Button>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm mt-6">
                <h4 className="font-medium text-yellow-800 mb-1">Table Type Tips</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>Create different table types based on seating capacity and location (indoor, outdoor, etc.)</li>
                  <li>Set accurate turnover times to improve wait time predictions</li>
                  <li>More specific table types lead to better customer matching and shorter wait times</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="optimization">
          <div className="mt-8 md:mt-0">
            <div className="bg-white rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Wait Time Optimization</h3>
              <p className="text-gray-600 mb-6">
                Apply restaurant operation management strategies to reduce wait times and improve customer experience.
              </p>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-6">
                <h4 className="font-medium text-blue-800 mb-2">Casual Dining Strategy Benefits</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-2">
                  <li>Reduce entrance wait times by up to 20% through smart table allocation</li>
                  <li>Increase table turnover efficiency with party size matching</li>
                  <li>Create balanced demand throughout the day with time-slot incentives</li>
                  <li>Improve customer satisfaction with accurate wait time predictions</li>
                </ul>
              </div>
            </div>
            
            {/* Demand Forecast and Table Optimization */}
            <DemandForecastDisplay restaurantId={DEMO_RESTAURANT.id} />
          </div>
        </TabsContent>
        
        <TabsContent value="promotions">
          <div className="bg-white rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Promotional Time Slot Offers</h3>
            <p className="mb-4 text-gray-600">
              Set percentage discounts for different time slots to encourage customers to book during off-peak hours. 
              This helps balance demand throughout the day and maximize your restaurant's capacity.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm mb-6">
              <h4 className="font-medium text-blue-800 mb-1">Promotion Strategy Tips</h4>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                <li>Offer higher discounts (15-20%) during traditionally slow periods</li>
                <li>Consider small discounts (5-10%) during shoulder periods just before or after peak times</li>
                <li>Promotions automatically appear to customers when they book through the remote waitlist</li>
                <li>Track the impact of promotions by monitoring customer distribution across time slots</li>
              </ul>
            </div>
            
            <RestaurantPromoManager restaurantId={DEMO_RESTAURANT.id} />
          </div>
        </TabsContent>
        
        <TabsContent value="qrcode">
          <div className="bg-white rounded-lg p-6 mb-6 mt-8 md:mt-0">
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
            
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <QrCode className="h-32 w-32 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center max-w-md">
                In your real account, you'll be able to generate a custom QR code that links directly to your restaurant's waitlist page.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => toast({ title: "Demo Mode", description: "In a real account, you could generate and download a QR code." })}>
                Generate QR Code
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Ready to create your account?</CardTitle>
              <CardDescription>
                Sign up now to access all features and start managing your restaurant's waitlist.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Link href="/auth">
                  <Button className="w-full sm:w-auto" size="lg">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Restaurant Account
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DemoDashboard;