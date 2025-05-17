import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser 
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

// Google sign-in function
export const signInWithGoogle = async () => {
  try {
    // On desktop, use a popup
    if (window.innerWidth > 768) {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } 
    // On mobile, use redirect flow
    else {
      await signInWithRedirect(auth, googleProvider);
      // The result will be handled in the component via onAuthStateChanged
    }
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
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