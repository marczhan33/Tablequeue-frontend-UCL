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
import { lazy } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

const ForgotPasswordPage = lazy(() => import("./pages/forgot-password"));
const PasswordResetPage = lazy(() => import("./pages/password-reset"));
import CustomerView from "@/pages/customer-view";
import RestaurantDashboard from "@/pages/restaurant-dashboard";
import DemoDashboard from "@/pages/demo-dashboard";
import RestaurantDetails from "@/pages/restaurant-details";
import RestaurantAnalytics from "@/pages/restaurant-analytics";
import HowItWorks from "@/pages/how-it-works";
import WaitlistPage from "@/pages/waitlist";
import RemoteWaitlistPage from "@/pages/remote-waitlist";
import WaitlistStatusPage from "@/pages/waitlist-status";
import JoinWaitlist from "@/pages/join-waitlist";
import ConfirmArrival from "@/pages/confirm-arrival";
import AuthPage from "@/pages/auth-page";
import CustomerAuth from "@/pages/customer-auth";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";

function AuthNavItem({ path, label }: { path: string, label: string }) {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Function to determine if a route is active
  const isActive = (path: string) => {
    return location === path || (path !== '/' && location.startsWith(path));
  };
  
  // Only show for restaurant owners
  if (!user || user.role !== 'owner') {
    return null;
  }
  
  return (
    <Link
      href={path}
      className={`whitespace-nowrap px-3 py-2 font-medium ${
        isActive(path) 
          ? "text-primary border-b-2 border-primary" 
          : "text-gray-500 hover:text-primary"
      }`}
    >
      {label}
    </Link>
  );
}

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

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        {user ? <CustomerView /> : <AuthPage />}
      </Route>
      <Route path="/restaurants">
        {user ? <CustomerView /> : <AuthPage />}
      </Route>
      <Route path="/restaurants/:id">
        <RestaurantDetails />
      </Route>
      <Route path="/restaurant/:id">
        <RestaurantDetails />
      </Route>
      <Route path="/restaurants/:id/analytics">
        <RestaurantAnalytics />
      </Route>
      <Route path="/demo-dashboard">
        <DemoDashboard />
      </Route>
      <ProtectedRoute path="/restaurant-dashboard" component={RestaurantDashboard} ownerOnly={true} />
      <Route path="/how-it-works">
        <HowItWorks />
      </Route>
      <Route path="/waitlist/:qrCodeId">
        <WaitlistPage />
      </Route>
      <Route path="/join-waitlist/:qrCodeId">
        <JoinWaitlist />
      </Route>
      <Route path="/confirm-arrival/:restaurantId/:confirmationCode">
        <ConfirmArrival />
      </Route>
      <Route path="/restaurants/:id/remote-waitlist">
        <RemoteWaitlistPage />
      </Route>
      <Route path="/restaurants/:restaurantId/waitlist-status/:entryId">
        <WaitlistStatusPage />
      </Route>
      <Route path="/auth">
        <AuthPage />
      </Route>
      <Route path="/customer-auth">
        <CustomerAuth />
      </Route>
      <Route path="/forgot-password">
        <ForgotPasswordPage />
      </Route>
      <Route path="/reset-password">
        <PasswordResetPage />
      </Route>
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Only show navigation tabs for authenticated users, and not on specific pages
  const showNavTabs = user && !location.startsWith('/restaurant/') && !location.startsWith('/restaurants/') && location !== '/auth';
  
  return (
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
                      className="whitespace-nowrap px-3 py-2 font-medium text-gray-500 hover:text-primary"
                    >
                      Customer View
                    </Link>
                    <Link
                      href="/how-it-works"
                      className="whitespace-nowrap px-3 py-2 font-medium text-gray-500 hover:text-primary"
                    >
                      How It Works
                    </Link>
                    <Link
                      href="/demo-dashboard"
                      className="whitespace-nowrap px-3 py-2 font-medium text-gray-500 hover:text-primary"
                    >
                      Restaurant Dashboard Demo
                    </Link>

                  </div>
                </div>
              </div>
            )}
            
            <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              {location !== '/auth' && user && (
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
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
