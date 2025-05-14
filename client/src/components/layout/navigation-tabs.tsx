import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface NavigationTabsProps {
  className?: string;
}

export function NavigationTabs({ className = "" }: NavigationTabsProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Function to determine if a route is active
  const isActive = (path: string) => {
    // Special case for the restaurant details page
    if (path === '/' && (location.startsWith('/restaurant/') || location.startsWith('/restaurants/'))) {
      return false;
    }
    // For other pages, exact match or startsWith for the base route
    return location === path || (path !== '/' && location.startsWith(path));
  };

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
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
          
          {user && user.role === 'owner' && (
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
          )}
          
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
          
          {!user && (
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
          )}
        </div>
      </div>
    </div>
  );
}