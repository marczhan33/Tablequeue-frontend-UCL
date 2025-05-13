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
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
  }
};