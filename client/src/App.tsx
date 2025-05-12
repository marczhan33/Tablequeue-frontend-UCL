import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CustomerView from "@/pages/customer-view";
import RestaurantDashboard from "@/pages/restaurant-dashboard";
import HowItWorks from "@/pages/how-it-works";
import NotFound from "@/pages/not-found";
import { useState } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CustomerView} />
      <Route path="/restaurant-dashboard" component={RestaurantDashboard} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Simple state to track active tab - normally would use a more robust solution
  const [activeTab, setActiveTab] = useState("customer-view");
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col bg-light text-dark">
          <Header />
          
          {/* Navigation Tabs */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex space-x-8 overflow-x-auto py-2 text-sm">
                <a 
                  href="/" 
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("customer-view");
                    window.history.pushState({}, "", "/");
                  }}
                  className={`whitespace-nowrap px-3 py-2 font-medium ${
                    activeTab === "customer-view" 
                      ? "text-primary border-b-2 border-primary" 
                      : "text-gray-500 hover:text-primary"
                  }`}
                >
                  Customer View
                </a>
                <a 
                  href="/restaurant-dashboard" 
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("restaurant-dashboard");
                    window.history.pushState({}, "", "/restaurant-dashboard");
                  }}
                  className={`whitespace-nowrap px-3 py-2 font-medium ${
                    activeTab === "restaurant-dashboard" 
                      ? "text-primary border-b-2 border-primary" 
                      : "text-gray-500 hover:text-primary"
                  }`}
                >
                  Restaurant Dashboard
                </a>
                <a 
                  href="/how-it-works" 
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("how-it-works");
                    window.history.pushState({}, "", "/how-it-works");
                  }}
                  className={`whitespace-nowrap px-3 py-2 font-medium ${
                    activeTab === "how-it-works" 
                      ? "text-primary border-b-2 border-primary" 
                      : "text-gray-500 hover:text-primary"
                  }`}
                >
                  How It Works
                </a>
              </div>
            </div>
          </div>
          
          <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {activeTab === "customer-view" && <CustomerView />}
            {activeTab === "restaurant-dashboard" && <RestaurantDashboard />}
            {activeTab === "how-it-works" && <HowItWorks />}
          </main>
          
          <Footer />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
