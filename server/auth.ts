import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import createMemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Create memory store for sessions
  const MemoryStore = createMemoryStore(session);
  const sessionStore = new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  });

  // Session configuration
  const sessionConfig: session.SessionOptions = {
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

  app.set("trust proxy", 1);
  app.use(session(sessionConfig));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // API routes for authentication
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, email, role = 'customer', phone } = req.body;
      
      // Check for missing required fields
      if (!username || !password || !email) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email address is already registered" });
      }

      // Generate verification token and expiration
      const { generateVerificationToken, sendVerificationEmail } = await import('./email-service');
      const { token, expires } = generateVerificationToken();

      // Hash the password and create the user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        role,
        phone,
        isVerified: false,
        verificationToken: token,
        verificationExpires: expires
      });

      // Attempt to send verification email
      await sendVerificationEmail(email, token, username)
        .catch(error => console.error("Failed to send verification email:", error));

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        // Return user without password and verification token
        const { password, verificationToken, ...userWithoutSensitiveData } = user;
        res.status(201).json(userWithoutSensitiveData);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: "Invalid username or password" });
      
      // Optional: Check if user is verified
      // Uncomment the following lines to require email verification before login
      /*
      if (!user.isVerified) {
        return res.status(403).json({ 
          error: "Email not verified", 
          message: "Please verify your email before logging in"
        });
      }
      */
      
      req.login(user, (err) => {
        if (err) return next(err);
        // Return user without sensitive data
        const { password, verificationToken, ...userWithoutSensitiveData } = user;
        res.status(200).json(userWithoutSensitiveData);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    // Return user without password
    const { password, verificationToken, ...userWithoutSensitiveData } = req.user as SelectUser;
    res.json(userWithoutSensitiveData);
  });
  
  // Email verification endpoint
  app.get("/api/verify-email", async (req, res) => {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: "Invalid verification token" });
    }
    
    try {
      // Find user with this token
      const user = await storage.getUserByVerificationToken(token);
      
      if (!user) {
        return res.status(404).json({ error: "Verification token not found" });
      }
      
      // Check if token has expired
      if (user.verificationExpires && new Date() > new Date(user.verificationExpires)) {
        return res.status(400).json({ error: "Verification token has expired" });
      }
      
      // Mark user as verified and clear the token
      await storage.updateUserVerification(user.id, true);
      
      // If user is logged in, update their session
      if (req.isAuthenticated() && req.user && (req.user as SelectUser).id === user.id) {
        (req.user as SelectUser).isVerified = true;
      }
      
      // Redirect to a success page or return success JSON response
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        // For browser requests - redirect to a success page
        res.redirect('/#verified=success');
      } else {
        // For API requests - return JSON
        res.json({ success: true, message: "Email verified successfully" });
      }
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ error: "Email verification failed" });
    }
  });
}