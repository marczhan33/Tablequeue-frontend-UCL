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
- 2025-01-20: Removed Direct Link verification method from check-in interface, simplified to Location and QR Code only
- 2025-01-20: Fixed QR code joining error by implementing proper estimated wait time calculation
- 2025-01-20: Resolved confirmation code display issue in staff check-in modal
- 2025-01-20: Updated check-in interface layout from 3 columns to 2 columns
- 2025-01-20: Deleted all user accounts for data cleanup (3 accounts removed)
- 2025-01-20: Deleted all waitlist entries for data cleanup (12 entries removed)

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