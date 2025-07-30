# Restaurant Queue Management Platform

## Overview
A comprehensive restaurant queue management platform that provides intelligent wait time predictions, real-time capacity insights, and flexible customer check-in methods with advanced queue management.

## Key Technologies
- React frontend with TypeScript
- Tailwind CSS for responsive design
- Firebase Authentication
- React Query for state management
- Mobile-first responsive design
- PostgreSQL database with Drizzle ORM
- Express.js backend

## Recent Changes
- 2025-01-30: Removed backend Google Maps integration code (maps-integration.ts) and related API calls for cleaner codebase
- 2025-01-30: Removed non-existent feature references (Google Maps wait time tips) from restaurant detail pages for cleaner UI
- 2025-01-30: Removed redundant "Smart Wait Management" section from restaurant details to streamline interface
- 2025-01-30: Implemented party size persistence across pages using localStorage - selection on main page carries to restaurant details
- 2025-01-30: Fixed wait time consistency between restaurant listing and detail pages using real-time capacity prediction API
- 2025-01-30: Extended login sessions to 7 days for persistent authentication - users stay logged in automatically
- 2025-01-30: Added prominent party size selection at top of customer view with easy increment/decrement controls
- 2025-01-30: Implemented real-time wait predictions using Advanced Wait Time Prediction API instead of manual status
- 2025-01-30: Removed manual status system (Available/Short/Long Wait) from restaurant dashboard entirely
- 2025-01-30: Added color-coded wait time badges: Green (0-15min), Orange (15-45min), Red (45+ min) with "Available" for 0 wait
- 2025-01-30: Simplified restaurant cards - removed Details button and eye icon, entire card now clickable for direct access
- 2025-01-30: Updated card layout with MapPin icon aligned with cuisine, party size indicator, and cleaner visual design
- 2025-01-30: Cleaned up restaurant card UI - removed duplicate price symbols, human party size icons, and repositioned elements
- 2025-01-30: Made price range display show only dollar symbols ($$) instead of numerical values ($11-$30) for cleaner look
- 2025-01-30: Added clickable map pin icon with "Get Directions" functionality - opens Google Maps with turn-by-turn directions
- 2025-01-29: Implemented comprehensive best practices following industry standards for scalable Replit projects
- 2025-01-29: Added complete testing infrastructure with Jest, ESLint, Prettier, and automated CI/CD pipeline
- 2025-01-29: Reorganized codebase with proper MVC architecture, controllers, middleware, and services separation
- 2025-01-29: Created comprehensive documentation including README, CONTRIBUTING, FEATURES, and environment setup
- 2025-01-29: Added proper error handling, logging utilities, and TypeScript strict mode compliance
- 2025-01-29: Implemented input validation middleware, authentication controllers, and notification services
- 2025-01-27: Completed SMS-only password reset system - users enter phone numbers directly, receive Twilio SMS codes, eliminated SendGrid dependency
- 2025-01-27: Fixed getUserByPhone method to handle duplicate phone numbers by prioritizing users with most recent reset tokens
- 2025-01-27: Updated forgot password interface to use phone number input instead of email for streamlined SMS verification
- 2025-01-27: Fixed "Back to login" navigation link to correctly point to /auth route instead of /login
- 2025-01-27: Updated Google OAuth buttons to use "Continue with Google" for improved UX clarity (single text for both login/signup)
- 2025-01-27: Removed "My Profile" tab from main navigation - profile page now exclusively accessible via user dropdown menu
- 2025-01-27: Implemented comprehensive user profile management system with secure backend API endpoint and form validation
- 2025-01-27: Added profile navigation link to user dropdown menu for easy access to profile updates
- 2025-01-27: Created dedicated profile page with username and phone number editing capabilities
- 2025-01-27: Made phone number mandatory in registration form - removed "(Optional)" text and added validation requiring minimum 10 characters
- 2025-01-27: Implemented customer-first authentication flow - Login/Register page now serves as landing page instead of restaurant listings
- 2025-01-27: Updated post-authentication UX - authenticated users see restaurant listings without Login/Register navigation tab
- 2025-01-26: Implemented AI-powered table management system with intelligent optimization suggestions
- 2025-01-26: Added AI demand prediction capabilities and capacity recommendations  
- 2025-01-26: Created AI Assistant Panel for restaurant dashboard with real-time suggestions
- 2025-01-26: Implemented advanced table combination logic for realistic restaurant operations
- 2025-01-26: Enhanced Smart Wait Time Management with manual/automatic mode toggle and improved calculation logic
- 2025-01-26: Fixed Advanced Queue Management to properly consider table utilization rates for more accurate predictions
- 2025-01-26: Improved wait time calculation to only consider competing parties using the same optimal table types
- 2025-01-26: Added intelligent wait time reduction in automatic mode when table utilization is low (reduces 35min to 10min predictions)
- 2025-01-20: Removed Direct Link verification method from check-in interface, simplified to Location and QR Code only
- 2025-01-20: Fixed QR code joining error by implementing proper estimated wait time calculation
- 2025-01-20: Resolved confirmation code display issue in staff check-in modal
- 2025-01-20: Updated check-in interface layout from 3 columns to 2 columns
- 2025-01-20: Deleted all user accounts for data cleanup (3 accounts removed)
- 2025-01-20: Deleted all waitlist entries for data cleanup (12 entries removed)
- 2025-01-20: Fixed opening hours editing functionality with proper save and display formatting
- 2025-01-20: Implemented party-size-specific wait times with database schema, API endpoints, and frontend integration

## User Preferences
- Prefers simplified interfaces over complex multi-option layouts
- Values data cleanup and fresh starts for testing  
- Wants clear status progression in queue management
- Prefers clean visual design with minimal clutter on restaurant cards
- Likes functional elements (like map pins) to have interactive capabilities

## Project Architecture
- **Frontend**: React with Wouter routing, shadcn/ui components, TypeScript strict mode
- **Backend**: Express.js with MVC architecture, controller/service/middleware separation
- **Database**: PostgreSQL with Drizzle ORM migrations and optimized queries
- **Authentication**: Session-based with Firebase OAuth integration
- **Testing**: Jest unit/integration tests, React Testing Library, 80%+ coverage target
- **Code Quality**: ESLint, Prettier, TypeScript strict mode, automated CI/CD pipeline
- **Services**: Organized notification, SMS, email, and AI services with proper error handling
- **Queue Management**: Status-based progression system with intelligent wait time predictions
- **Check-in Methods**: Location verification and QR code scanning with automated cleanup
- **Documentation**: Comprehensive README, CONTRIBUTING, FEATURES, and API documentation