import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, RouteProps, useLocation } from "wouter";

interface ProtectedRouteProps extends RouteProps {
  ownerOnly?: boolean;
}

export function ProtectedRoute({
  path,
  ownerOnly = false,
  component: Component,
  ...rest
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
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
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
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

  return <Route path={path} component={Component} {...rest} />;
}