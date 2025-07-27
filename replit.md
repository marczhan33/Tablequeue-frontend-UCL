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

## Project Architecture
- Frontend: React with Wouter routing, shadcn/ui components
- Backend: Express.js with session-based authentication
- Database: PostgreSQL with Drizzle ORM migrations
- Queue Management: Status-based progression system
- Check-in Methods: Location verification and QR code scanning only