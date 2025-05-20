import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Create a session store
export const sessionStore = new MemoryStore({
  // Cleanup expired sessions every 24 hours
  checkPeriod: 86400000
});

// Session configuration
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'tablequeue-session-secret', // In production, use environment variable
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { 
    httpOnly: true, 
    secure: false, // Set to false for development to work on both HTTP and HTTPS
    sameSite: 'lax', // To help with cross-site cookie issues
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days for better persistence
  }
};