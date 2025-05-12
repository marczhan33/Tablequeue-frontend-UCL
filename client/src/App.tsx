import { Switch, Route, useLocation, Link } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CustomerView from "@/pages/customer-view";
import RestaurantDashboard from "@/pages/restaurant-dashboard";
import RestaurantDetails from "@/pages/restaurant-details";
import HowItWorks from "@/pages/how-it-works";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CustomerView} />
      <Route path="/restaurant/:id" component={RestaurantDetails} />
      <Route path="/restaurant-dashboard" component={RestaurantDashboard} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  
  // Function to determine if a route is active
  const isActive = (path: string) => {
    // Special case for the restaurant details page
    if (path === '/' && location.startsWith('/restaurant/')) {
      return false;
    }
    // For other pages, exact match or startsWith for the base route
    return location === path || (path !== '/' && location.startsWith(path));
  };
  
  // Don't show navigation tabs on restaurant details page
  const showNavTabs = !location.startsWith('/restaurant/');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col bg-light text-dark">
          <Header />
          
          {/* Navigation Tabs */}
          {showNavTabs && (
            <div className="bg-white border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-8 overflow-x-auto py-2 text-sm">
                  <Link
                    href="/"
                    className={`whitespace-nowrap px-3 py-2 font-medium ${
                      isActive('/') 
                        ? "text-primary border-b-2 border-primary" 
                        : "text-gray-500 hover:text-primary"
                    }`}
                  >
                    Customer View
                  </Link>
                  <Link
                    href="/restaurant-dashboard"
                    className={`whitespace-nowrap px-3 py-2 font-medium ${
                      isActive('/restaurant-dashboard') 
                        ? "text-primary border-b-2 border-primary" 
                        : "text-gray-500 hover:text-primary"
                    }`}
                  >
                    Restaurant Dashboard
                  </Link>
                  <Link
                    href="/how-it-works"
                    className={`whitespace-nowrap px-3 py-2 font-medium ${
                      isActive('/how-it-works') 
                        ? "text-primary border-b-2 border-primary" 
                        : "text-gray-500 hover:text-primary"
                    }`}
                  >
                    How It Works
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <Router />
          </main>
          
          <Footer />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
