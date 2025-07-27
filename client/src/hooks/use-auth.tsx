import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  signInWithGoogle, 
  signOut as firebaseSignOut, 
  onAuthChange,
  getCurrentUser
} from "@/lib/firebase";
import { getAuth, getRedirectResult } from "firebase/auth";

type AuthContextType = {
  user: SelectUser | null;
  firebaseUser: any | null;
  isLoading: boolean;
  error: Error | null;
  loginWithGoogle: () => Promise<void>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      console.log("Firebase auth state changed:", user ? "user signed in" : "no user");
      setFirebaseUser(user);
      
      // Only sync with backend if this is a fresh login (no existing user data)
      if (user) {
        const existingUser = queryClient.getQueryData(["/api/user"]);
        if (!existingUser) {
          syncUserWithBackend(user);
        }
      } else {
        // Only clear if we don't have a session-based authentication
        if (!localStorage.getItem("auth_session_active")) {
          queryClient.setQueryData(["/api/user"], null);
        }
      }
    });
    
    // Check for current user on page load (for redirect flow)
    const currentUser = getCurrentUser();
    if (currentUser) {
      console.log("Found existing Firebase user on page load");
      setFirebaseUser(currentUser);
      syncUserWithBackend(currentUser);
    }
    
    // Also check for session-based authentication on load
    const checkSessionAuth = async () => {
      try {
        // If we have a stored session marker, verify it with the server
        if (localStorage.getItem("auth_session_active")) {
          console.log("Checking for active session authentication...");
          const response = await fetch('/api/auth/status', {
            credentials: 'include' // Important for session cookies
          });
          
          if (response.ok) {
            const status = await response.json();
            console.log("Session auth status check:", status);
            
            // If authenticated but no user data loaded yet, fetch the user
            if (status.isAuthenticated && !user) {
              console.log("Session is authenticated, loading user data");
              const userResponse = await fetch('/api/user', {
                credentials: 'include'
              });
              
              if (userResponse.ok) {
                const userData = await userResponse.json();
                console.log("Loaded user from session:", userData);
                queryClient.setQueryData(["/api/user"], userData);
              }
            }
          } else {
            // If server says we're not authenticated, clear the local marker
            localStorage.removeItem("auth_session_active");
          }
        }
      } catch (error) {
        console.error("Error checking session authentication:", error);
      }
    };
    
    // Run the session check
    checkSessionAuth();
    
    return () => unsubscribe();
  }, []);

  // Function to sync Firebase user with our backend
  const syncUserWithBackend = async (firebaseUser: any) => {
    // Prevent multiple simultaneous sync attempts
    if (isSyncing) {
      console.log("Sync already in progress, skipping");
      return;
    }
    
    try {
      if (!firebaseUser) {
        console.log("No Firebase user to sync");
        return;
      }
      
      setIsSyncing(true);
      
      // Check if user is already synced to prevent unnecessary requests
      const existingUser = queryClient.getQueryData(["/api/user"]);
      if (existingUser && existingUser.uid === firebaseUser.uid) {
        console.log("User already synced, skipping");
        return;
      }
      
      console.log("Attempting to sync user with backend", { 
        uid: firebaseUser.uid,
        email: firebaseUser.email
      });
      
      // Get the ID token
      const idToken = await firebaseUser.getIdToken(true);
      console.log("Got ID token successfully");
      
      // Send to our backend
      const res = await apiRequest({ 
        method: "POST", 
        url: "/api/auth/google", 
        body: { idToken } 
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || 'Failed to authenticate with server');
      }
      
      const backendUser = await res.json().catch(err => {
        console.error("Failed to parse user JSON", err);
        return null;
      });

      if (!backendUser) {
        throw new Error("Failed to parse user data from server");
      }
      
      console.log("User synced with backend successfully", backendUser);
      queryClient.setQueryData(["/api/user"], backendUser);
      
      // Store authentication state
      localStorage.setItem("auth_session_active", "true");
      localStorage.setItem("auth_timestamp", Date.now().toString());
      
      // Only show success message and navigate for fresh logins
      if (!existingUser) {
        toast({
          title: "Signed in successfully",
          description: `Welcome${backendUser.username ? ', ' + backendUser.username : ''}!`,
        });
      }
    } catch (error: any) {
      console.error("Error syncing user with backend:", error);
      
      toast({
        title: "Authentication Error",
        description: error.message || "There was a problem connecting to the server. Please try again.",
        variant: "destructive",
      });
      
      // Clear Firebase state on failure
      firebaseSignOut().catch(err => console.error("Failed to sign out from Firebase", err));
    } finally {
      setIsSyncing(false);
    }
  };

  // Get the user from our backend
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Continue with Google (handles both login and registration)
  const loginWithGoogle = async () => {
    try {
      console.log("Google authentication initiated");
      await signInWithGoogle();
      // Don't handle the result here - let the auth state listener handle it
      // This prevents duplicate authentication attempts
    } catch (error: any) {
      console.error("Google authentication error:", error);
      toast({
        title: "Authentication failed",
        description: error.message || "Could not continue with Google",
        variant: "destructive",
      });
    }
  };

  // Register new user
  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest({ 
        method: "POST", 
        url: "/api/register", 
        body: credentials 
      });
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest({ 
        method: "POST", 
        url: "/api/logout"
      });
      await firebaseSignOut(); // Also sign out from Firebase
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        firebaseUser,
        isLoading,
        error,
        loginWithGoogle,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}