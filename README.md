# Restaurant Queue Management Platform 🍽️

A comprehensive restaurant queue management platform that provides intelligent wait time predictions, real-time capacity insights, and flexible customer check-in methods with advanced queue management.

## 🚀 Features

### 🔐 Authentication System
- **Firebase Google OAuth** integration with duplicate prevention
- **SMS-only password reset** using Twilio
- **Session-based authentication** with PostgreSQL
- **Phone number verification** system
- **Comprehensive user profile** management

### 📱 Queue Management
- **Digital queue system** with real-time updates
- **Party-size-specific** wait time predictions
- **QR code generation** for customer check-ins
- **Location-based verification**
- **Remote waitlist management** with grace periods
- **Automated cleanup** of expired entries

### 🏪 Restaurant Dashboard
- **Table management** with intelligent optimization
- **AI-powered demand prediction** and capacity recommendations
- **Smart wait time management** (manual/automatic modes)
- **Real-time analytics** and turnover tracking
- **Staff notification system** via SMS

### 🤖 AI-Powered Features
- **Table allocation optimization**
- **Demand forecasting** based on historical data
- **Intelligent wait time reduction** algorithms
- **Smart capacity utilization** recommendations

## 🛠️ Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Firebase Auth + Session-based auth
- **Notifications**: Twilio SMS, SendGrid Email
- **State Management**: React Query (TanStack Query)
- **Routing**: Wouter
- **Styling**: Tailwind CSS with custom design system

## 📦 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Replit account (for environment variables)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd restaurant-queue-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## 🏗️ Project Structure

```
├── client/src/           # React frontend
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and configurations
│   └── utils/           # Helper functions
├── server/              # Express.js backend
│   ├── controllers/     # API route handlers
│   ├── middleware/      # Express middleware
│   ├── services/        # Business logic services
│   ├── ai/             # AI-powered features
│   └── analytics/       # Analytics and reporting
├── shared/              # Shared TypeScript types
├── tests/               # Test files and setup
└── docs/                # Documentation
```

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:push         # Push schema changes to database

# Code Quality
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
npm run type-check      # TypeScript type checking

# Testing
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
```

## 📊 Testing

The project includes comprehensive testing setup:

- **Unit Tests**: Jest with React Testing Library
- **Integration Tests**: API endpoint testing with Supertest
- **Coverage Reports**: Automated test coverage tracking
- **CI/CD Pipeline**: GitHub Actions for automated testing

Run tests with:
```bash
npm test
npm run test:coverage
```

## 🚀 Deployment

### Replit Deployment

1. **Environment Setup**: Configure secrets in Replit
2. **Database**: PostgreSQL is automatically provisioned
3. **Build**: Run `npm run build` to create production build
4. **Deploy**: Use Replit's deployment feature

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**

3. **Start the production server**
   ```bash
   npm start
   ```

## 🔐 Environment Variables

Required environment variables (see `.env.example` for complete list):

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
SESSION_SECRET="your-secret-key"
VITE_FIREBASE_API_KEY="your-firebase-key"

# SMS Notifications
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Email Notifications (Optional)
SENDGRID_API_KEY="your-sendgrid-key"

# Maps Integration
VITE_GOOGLE_MAPS_API_KEY="your-maps-key"
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes following our coding standards
4. **Add** tests for new functionality
5. **Run** the test suite: `npm test`
6. **Commit** your changes: `git commit -m 'Add amazing feature'`
7. **Push** to the branch: `git push origin feature/amazing-feature`
8. **Open** a Pull Request

### Code Standards

- **TypeScript**: Strict typing, prefer interfaces over types
- **React**: Functional components with hooks
- **Testing**: Unit tests for all new features
- **Linting**: ESLint + Prettier for code formatting
- **Commits**: Conventional commit format

## 📈 Performance & Analytics

The platform includes comprehensive analytics:

- **Real-time metrics** for wait times and customer flow
- **Historical data analysis** for demand prediction
- **Table turnover optimization** recommendations
- **Customer satisfaction tracking**

## 🔒 Security

Security measures implemented:

- **Input validation** with Zod schemas
- **SQL injection prevention** with parameterized queries
- **Session management** with secure cookies
- **Rate limiting** on API endpoints
- **HTTPS encryption** in production

## 📱 Mobile Support

Fully responsive design optimized for:

- **iOS Safari** and **Android Chrome**
- **Touch-friendly** interfaces
- **Offline capability** for basic functions
- **Progressive Web App** features

## 🆘 Support

- **Documentation**: See the `/docs` folder for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Feature Requests**: Submit via GitHub Discussions
- **Security**: Email security@example.com for security issues

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Replit** for providing an excellent development environment
- **Firebase** for authentication services
- **Twilio** for SMS integration
- **Tailwind CSS** for the design system
- **shadcn/ui** for UI components

## 📊 Project Status

- **Build Status**: ![CI](https://github.com/username/repo/workflows/CI/badge.svg)
- **Test Coverage**: ![Coverage](https://codecov.io/gh/username/repo/branch/main/graph/badge.svg)
- **Version**: v1.0.0
- **Maintenance**: Actively maintained

---

Built with ❤️ for restaurant owners and customers everywhere.