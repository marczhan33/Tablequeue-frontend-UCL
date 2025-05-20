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

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      console.log("Firebase auth state changed:", user ? "user signed in" : "no user");
      setFirebaseUser(user);
      
      // If a user signs in via Firebase, we need to sync with our backend
      if (user) {
        syncUserWithBackend(user);
      } else {
        // If firebase user logs out, clear our backend user too
        queryClient.setQueryData(["/api/user"], null);
      }
    });
    
    // Check for current user on page load (for redirect flow)
    const currentUser = getCurrentUser();
    if (currentUser) {
      console.log("Found existing Firebase user on page load");
      setFirebaseUser(currentUser);
      syncUserWithBackend(currentUser);
    }
    
    // We'll handle the redirect with our custom implementation

    return () => unsubscribe();
  }, []);

  // Function to sync Firebase user with our backend
  const syncUserWithBackend = async (firebaseUser: any) => {
    try {
      if (!firebaseUser) {
        console.log("No Firebase user to sync");
        return;
      }
      
      // Add additional logging to help debug
      console.log("Attempting to sync user with backend", { 
        uid: firebaseUser.uid,
        email: firebaseUser.email
      });
      
      // Get the ID token
      const idToken = await firebaseUser.getIdToken(true); // Force refresh token
      console.log("Got ID token successfully");
      
      // Send to our backend
      const res = await apiRequest({ 
        method: "POST", 
        url: "/api/auth/google", 
        body: { idToken } 
      });
      
      // Handle non-ok responses before trying to parse JSON
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
      
      // Navigate to home after successful login
      window.location.href = '/';
      
      // Show success message
      toast({
        title: "Signed in successfully",
        description: `Welcome${backendUser.username ? ', ' + backendUser.username : ''}!`,
      });
    } catch (error: any) {
      console.error("Error syncing user with backend:", error);
      
      // Provide more helpful error message
      toast({
        title: "Authentication Error",
        description: error.message || "There was a problem connecting to the server. Please try again.",
        variant: "destructive",
      });
      
      // Clear Firebase state on failure
      firebaseSignOut().catch(err => console.error("Failed to sign out from Firebase", err));
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

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      console.log("Google login initiated");
      const googleUser = await signInWithGoogle();
      
      if (googleUser) {
        console.log("Google authentication successful, getting token...");
        
        // Get ID token and explicitly sync with backend
        const idToken = await googleUser.getIdToken(true);
        
        // Use credentials: 'include' to ensure cookies are sent with request
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
          credentials: 'include' // This is crucial for cookie-based auth
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Authentication failed");
        }
        
        // Process user data and update state
        const userData = await response.json();
        queryClient.setQueryData(["/api/user"], userData);
        
        // Store authentication state in localStorage as well
        localStorage.setItem("auth_session_active", "true");
        localStorage.setItem("auth_timestamp", Date.now().toString());
        
        // Force a complete page reload to apply session cookies properly
        window.location.href = "/";
        
        toast({
          title: "Sign in successful",
          description: `Welcome${userData.username ? ', ' + userData.username : ''}!`,
        });
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Could not sign in with Google",
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