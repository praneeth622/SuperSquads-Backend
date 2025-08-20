# Super Squads Backend

A NestJS backend powering a gated "Internshala-like" marketplace exclusively for Tier-1 students and verified recruiters.

## Architecture

- **API**: NestJS with modular architecture
- **Auth**: Supabase Auth (JWT) with Google/LinkedIn OAuth
- **Database**: Neon Postgres with TypeORM
- **Cache/Rate Limiting**: Redis (Upstash or managed)
- **Storage**: S3-compatible storage (AWS S3, Cloudflare R2, or Supabase Storage)
- **Validation**: Zod schemas for all inputs
- **Security**: JWT verification, RBAC, college email verification
- **Observability**: Pino logging, health checks

## Features

### Authentication & Authorization
- ✅ Supabase JWT verification
- ✅ Role-based access control (Student, Recruiter, Admin)
- ✅ College email verification for Tier-1 students
- ✅ Webhook-based user synchronization

### Security
- ✅ Rate limiting with Redis
- ✅ Zod validation for all inputs
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ JWT audience and issuer validation

### Infrastructure
- ✅ Health checks (/health, /ready)
- ✅ Docker containerization
- ✅ Environment validation with Zod
- ✅ Comprehensive logging
- ✅ Database migrations ready

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)

### Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Update `.env` with your actual values:
```bash
# Required: Database
DATABASE_URL=postgresql://username:password@host:5432/database

# Required: Redis
REDIS_URL=redis://localhost:6379

# Required: Supabase
SUPABASE_PROJECT_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_WEBHOOK_SECRET=your-webhook-secret

# Required: Security
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
```

### Development with Docker

```bash
# Start all services (app, postgres, redis)
npm run docker:dev

# Or manually:
docker-compose up --build
```

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Run tests
npm test

# Run e2e tests
npm run test:e2e
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/webhooks/supabase` - Sync users from Supabase
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/verify-college` - Send college verification email
- `POST /api/v1/auth/verify-college/callback` - Verify college email token

### Health Checks
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/ready` - Readiness check (DB + Redis)

### Documentation
- `GET /api/docs` - Swagger documentation (development only)

## Database Schema

The application includes comprehensive entities for:

- **Users**: Core user management with Supabase integration
- **Colleges**: Tier-1 college domain allowlist
- **Companies**: Recruiter company profiles
- **Jobs**: Job postings with skills, locations, work modes
- **Applications**: Student job applications with status tracking
- **Student Profiles**: Detailed student information
- **Skills**: Skill catalog with proficiency levels
- **Files**: File management for resumes, documents
- **Notifications**: Email/push notification tracking

## Security Features

### JWT Verification
- Verifies Supabase JWTs using JWKS
- Validates audience and issuer
- Automatic user creation/sync

### Rate Limiting
- Global: 100 requests/60s per IP
- Sensitive routes have stricter limits
- Redis-backed for distributed systems

### College Verification
- Email domain validation against Tier-1 colleges
- Magic link verification process
- Required for student access to job applications

### Role-Based Access Control
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@UseGuards(CollegeVerifiedGuard) // For students only
```

## Deployment

### Production Environment Variables
```bash
NODE_ENV=production
DATABASE_URL=postgresql://... # Neon connection string
REDIS_URL=redis://... # Upstash or managed Redis
SUPABASE_PROJECT_URL=https://...
# ... other required vars
```

### Docker Production
```bash
docker build -t super-squads-backend .
docker run -p 3000:3000 --env-file .env super-squads-backend
```

### Health Checks
The application provides health checks for:
- Database connectivity
- Redis connectivity
- Basic service status

## Development

### Adding New Modules
1. Create entity in `src/entities/`
2. Create DTOs with Zod schemas in `src/modules/*/dto/`
3. Create service and controller
4. Add module to `AppModule`
5. Generate and run migrations

### Database Migrations
```bash
# Generate migration
npm run migration:generate src/migrations/YourMigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Testing
```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

## Next Steps

To complete the implementation:

1. **Add remaining modules**: Jobs, Applications, Profiles, Skills
2. **Implement file upload**: S3/R2 integration with resume parsing
3. **Add email service**: Postmark/SES integration for notifications
4. **Create recommendation engine**: Job matching algorithm
5. **Add search functionality**: Elasticsearch or PostgreSQL full-text search
6. **Implement real-time features**: WebSockets for notifications
7. **Add monitoring**: OpenTelemetry, metrics, alerts
8. **Set up CI/CD**: GitHub Actions for automated testing and deployment

## License

Private - All rights reserved
