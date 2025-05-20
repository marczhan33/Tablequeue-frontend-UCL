import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  getRedirectResult
} from "firebase/auth";

// Your web app's Firebase configuration
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

// Check if the Firebase config is properly loaded
console.log('Firebase config status:', {
  apiKeyExists: !!apiKey,
  projectIdExists: !!projectId,
  appIdExists: !!appId
});

// Flag to determine if we're using demo mode (when Firebase credentials are missing)
export const isDemoMode = !apiKey || !projectId || !appId;

// Warn about missing configuration but don't block app functionality
if (isDemoMode) {
  console.warn('Firebase configuration is incomplete. The app will run in demo mode with simulated authentication.');
}

const firebaseConfig = {
  // Use provided values or fallbacks for demo mode
  apiKey: apiKey || 'demo-api-key',
  authDomain: projectId ? `${projectId}.firebaseapp.com` : 'demo-project.firebaseapp.com',
  projectId: projectId || 'demo-project-id',
  storageBucket: projectId ? `${projectId}.appspot.com` : 'demo-project.appspot.com',
  messagingSenderId: "",
  appId: appId || 'demo-app-id',
};

// Initialize Firebase - handle potential duplicate app errors
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  // If app already exists, get the existing one
  console.log("Using existing Firebase app instance");
}

const auth = getAuth();
const googleProvider = new GoogleAuthProvider();

// Google sign-in function with better error handling and support for all environments
export const signInWithGoogle = async () => {
  try {
    console.log("Starting Google sign-in process");
    
    // Configure additional scopes
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    
    // Add custom parameters for better mobile support
    googleProvider.setCustomParameters({
      prompt: 'select_account',
      login_hint: ''
    });
    
    // Use redirect on mobile to avoid popup issues
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      console.log("Using redirect auth flow for mobile");
      await signInWithRedirect(auth, googleProvider);
      // The result will be handled in the auth state change listener
      return null;
    } else {
      console.log("Using popup auth flow for desktop");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google sign-in successful", { 
        email: result.user.email,
        uid: result.user.uid
      });
      return result.user;
    }
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    
    // Provide detailed error information
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled. Please try again.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked by your browser. Please allow pop-ups for this site.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Another authentication request is in progress.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized for OAuth operations. Please add it to your Firebase Console.');
    } else {
      throw new Error(`Authentication error: ${error.message || 'Unknown error'}`);
    }
  }
};

// Sign out function
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Helper to listen to auth state changes
export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { auth };