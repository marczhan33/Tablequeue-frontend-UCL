# Restaurant Wait Time App

A restaurant wait time notification app that integrates with Google Maps to show real-time queue status to customers.

## Features

- Restaurant dashboard to update wait times
- Customer view to see wait times before visiting
- Google Maps integration for directions and location
- Real-time wait time updates
- Responsive design for mobile and desktop

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database (optional, app uses in-memory by default)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

### Setting up the Database

The application is currently configured to use in-memory storage by default. To set up a PostgreSQL database:

1. Create a PostgreSQL database
2. Set the `DATABASE_URL` environment variable to your database connection string
3. Run the database preparation script:
   ```
   node prepare-db.js
   ```
4. Initialize the database schema:
   ```
   npx tsx scripts/init-db.ts
   ```
5. Update `server/storage.ts` to use database storage instead of in-memory storage

## Google Maps Integration

The application integrates with Google Maps to show restaurant locations and provide directions. To set up Google Maps:

1. Get a Google Maps API key
2. Set the environment variable `VITE_GOOGLE_MAPS_API_KEY` to your API key

## Project Structure

- `client/`: Frontend code using React and Vite
- `server/`: Backend code using Express
- `shared/`: Shared code including schema definitions
- `scripts/`: Helper scripts including database initialization
- `prepare-db.js`: Database preparation information

## Technologies

- Frontend: React, TypeScript, TailwindCSS, shadcn/ui
- Backend: Express, Node.js, TypeScript
- Database: PostgreSQL (optional), Drizzle ORM
- Maps: Google Maps API

## License

MIT