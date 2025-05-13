import { Switch, Route, useLocation, Link } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { VerificationStatus } from "@/components/verification-status";
import { DevModeNotice } from "@/components/dev-mode-notice";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CustomerView from "@/pages/customer-view";
import RestaurantDashboard from "@/pages/restaurant-dashboard";
import RestaurantDetails from "@/pages/restaurant-details";
import HowItWorks from "@/pages/how-it-works";
import WaitlistPage from "@/pages/waitlist";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ path, component: Component, ownerOnly = false }: { path: string, component: React.ComponentType, ownerOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (ownerOnly && user.role !== "owner") {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-lg mb-6">You must be a restaurant owner to access this page.</p>
          <button 
            onClick={() => setLocation("/")}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={CustomerView} />
      <Route path="/restaurant/:id" component={RestaurantDetails} />
      <Route path="/restaurant-dashboard">
        <RestaurantDashboard />
      </Route>
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/waitlist/:qrCodeId" component={WaitlistPage} />
      <Route path="/auth" component={AuthPage} />
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
  
  // Don't show navigation tabs on authentication or restaurant details pages
  const showNavTabs = !location.startsWith('/restaurant/') && location !== '/auth';
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
                    <Link
                      href="/auth"
                      className={`whitespace-nowrap px-3 py-2 font-medium ${
                        isActive('/auth') 
                          ? "text-primary border-b-2 border-primary" 
                          : "text-gray-500 hover:text-primary"
                      }`}
                    >
                      Login / Register
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              {location !== '/auth' && (
                <>
                  <DevModeNotice />
                  <VerificationStatus />
                </>
              )}
              <Router />
            </main>
            
            <Footer />
            <Toaster />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
