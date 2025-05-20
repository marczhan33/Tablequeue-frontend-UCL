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
  resave: true, // Changed to true to ensure session is saved back to store
  saveUninitialized: true, // Changed to true to allow session creation before authentication
  store: sessionStore,
  cookie: { 
    httpOnly: true, 
    secure: false, // Set to false for development to work on both HTTP and HTTPS
    sameSite: 'none', // Allow cross-domain cookies
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for better persistence
    path: '/',
    domain: undefined // Let browser automatically assign the domain
  }
};