# Contributing to Restaurant Queue Management Platform

## Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Replit account (for environment variables)

### Local Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `npm run db:push`
5. Start development server: `npm run dev`

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/restaurant_queue"

# Authentication
SESSION_SECRET="your-secure-session-secret"

# Firebase (for Google OAuth)
VITE_FIREBASE_API_KEY="your-firebase-api-key"
VITE_FIREBASE_PROJECT_ID="your-firebase-project-id"
VITE_FIREBASE_APP_ID="your-firebase-app-id"

# Twilio (for SMS)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-phone-number"

# SendGrid (optional, for email notifications)
SENDGRID_API_KEY="your-sendgrid-api-key"

# Google Maps (for location services)
VITE_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

## Code Standards

### TypeScript
- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use proper typing for all functions and variables
- Avoid `any` - use proper types or `unknown`

### React Components
- Use functional components with hooks
- Implement proper prop types with TypeScript interfaces
- Use React Query for data fetching
- Follow atomic design principles

### Backend API
- Use proper HTTP status codes
- Implement input validation with Zod schemas
- Follow RESTful conventions
- Include proper error handling

### Testing
- Write unit tests for all utilities and services
- Write integration tests for API endpoints
- Write component tests for React components
- Aim for >80% test coverage

## Development Workflow

### Before Making Changes
1. Pull latest changes from main branch
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Run tests to ensure everything works: `npm test`

### While Developing
1. Write code following our standards
2. Add/update tests for your changes
3. Run linting: `npm run lint`
4. Run tests: `npm test`
5. Commit with clear, descriptive messages

### Before Submitting
1. Run the full test suite: `npm run test:coverage`
2. Ensure linting passes: `npm run lint:check`
3. Check formatting: `npm run format:check`
4. Update documentation if needed
5. Create pull request with description of changes

## Testing Guidelines

### Unit Tests
- Test individual functions in isolation
- Mock external dependencies
- Test both success and error cases
- Use descriptive test names

### Integration Tests
- Test API endpoints with real database
- Test authentication flows
- Test error handling
- Use test database for isolation

### Component Tests
- Test user interactions
- Test props and state changes
- Test accessibility
- Mock API calls

## Commit Message Convention

Use conventional commits format:
```
type(scope): description

types: feat, fix, docs, style, refactor, test, chore
scope: component or area affected
description: brief description of change
```

Examples:
- `feat(auth): add SMS password reset`
- `fix(queue): resolve wait time calculation bug`
- `docs(api): add endpoint documentation`
- `test(components): add waitlist form tests`

## Architecture Guidelines

### File Organization
```
├── server/
│   ├── auth/              # Authentication logic
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   ├── models/            # Database models
│   └── utils/             # Shared utilities
├── client/src/
│   ├── components/        # Reusable UI components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and configurations
│   └── utils/             # Helper functions
├── shared/                # Shared TypeScript types
└── tests/                 # Test utilities and setup
```

### Code Organization Principles
- **Separation of Concerns**: Keep business logic separate from UI logic
- **Single Responsibility**: Each file/function should have one clear purpose
- **DRY (Don't Repeat Yourself)**: Extract common logic into reusable functions
- **Dependency Injection**: Use dependency injection for testability
- **Error Handling**: Implement comprehensive error handling at all levels

## Performance Guidelines

### Frontend
- Use React.memo for expensive components
- Implement proper loading states
- Optimize bundle size with code splitting
- Use React Query for efficient data fetching

### Backend
- Implement database connection pooling
- Use proper indexing for database queries
- Implement rate limiting for API endpoints
- Cache frequently accessed data

### Database
- Use proper indexing strategies
- Implement query optimization
- Use connection pooling
- Regular database maintenance

## Security Guidelines

### Input Validation
- Validate all user inputs server-side
- Use Zod schemas for type-safe validation
- Sanitize inputs to prevent XSS
- Implement proper SQL injection prevention

### Authentication & Authorization
- Use secure session management
- Implement proper role-based access control
- Secure API endpoints with proper middleware
- Use HTTPS in production

### Data Protection
- Hash sensitive data (passwords, tokens)
- Implement proper data encryption
- Follow GDPR compliance for user data
- Regular security audits

## Debugging Guidelines

### Development Tools
- Use browser developer tools for frontend debugging
- Use proper logging for backend debugging
- Implement comprehensive error tracking
- Use debugger statements judiciously

### Common Issues
- Database connection problems
- Authentication flow issues
- API endpoint errors
- Frontend state management issues

## Resources

### Documentation
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

### Tools
- [Replit Development Environment](https://replit.com/)
- [Firebase Console](https://console.firebase.google.com/)
- [Twilio Console](https://console.twilio.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)