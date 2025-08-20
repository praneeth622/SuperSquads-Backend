# Auth Module

## Overview
The Auth module provides comprehensive authentication and authorization functionality using Supabase JWT tokens. It handles user authentication, college email verification, role-based access control, and secure webhook processing for user lifecycle management.

## Features Implemented

### 1. Auth DTOs (`/src/auth/dto/auth.dto.ts`)
- **SupabaseWebhookDto**: Handles Supabase user lifecycle webhooks (created, updated, deleted)
- **VerifyCollegeEmailDto**: College email verification request structure
- **VerifyCollegeCallbackDto**: Verification token callback handling
- **UserResponseDto**: Comprehensive user response with verification status

### 2. Auth Service (`/src/auth/auth.service.ts`)
- **User Management**:
  - `findUserById()`: Get user by ID with relations
  - `findUserByEmail()`: Find user by email address
  - `updateLastLogin()`: Track user login activity

- **College Verification**:
  - `verifyCollegeEmail()`: Initiate college email verification process
  - `verifyCollegeCallback()`: Complete verification via token
  - `getAllowedColleges()`: Get list of eligible colleges
  - `isCollegeEmailAllowed()`: Validate college email domain

- **Security Features**:
  - Email domain validation against approved colleges
  - Secure token generation with expiration
  - Verification status tracking

### 3. Auth Controller (`/src/auth/auth.controller.ts`)
- **Public Endpoints**:
  - `POST /auth/webhooks/supabase`: Handle Supabase user lifecycle events
  - `POST /auth/verify-college/callback`: Complete college email verification

- **Authenticated Endpoints**:
  - `GET /auth/me`: Get current user information
  - `POST /auth/verify-college`: Initiate college email verification

- **Webhook Processing**:
  - User creation event handling
  - User update synchronization
  - User deletion cleanup
  - Email domain classification

### 4. JWT Strategy (`/src/auth/jwt.strategy.ts`)
- **Token Validation**:
  - Supabase JWT verification using JWKS
  - Audience and issuer validation
  - Automatic token extraction from Authorization header

- **User Lifecycle**:
  - Lazy user creation from JWT payload
  - Last login tracking
  - User synchronization with Supabase

### 5. Supabase Service (`/src/auth/supabase.service.ts`)
- **Supabase Integration**:
  - Client configuration and initialization
  - JWT token verification
  - User authentication state management

### 6. Auth Guards & Decorators
- **JwtAuthGuard**: Protects routes requiring authentication
- **RolesGuard**: Enforces role-based access control
- **CollegeVerifiedGuard**: Requires college email verification for students
- **CurrentUser**: Decorator to inject authenticated user
- **Roles**: Decorator to specify required roles

## API Documentation

### Get Current User
```http
GET /auth/me
Authorization: Bearer <supabase_jwt_token>

Response:
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "john.doe@student.university.edu",
  "role": "student",
  "status": "active",
  "verification_status": "verified",
  "verified_college_affiliation": true,
  "college_email": "john.doe@student.university.edu",
  "email_domain": "student.university.edu",
  "created_at": "2024-03-15T10:30:00.000Z",
  "last_login_at": "2024-03-20T14:25:00.000Z"
}
```

### Initiate College Email Verification
```http
POST /auth/verify-college
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json

{
  "college_email": "john.doe@student.iitb.ac.in"
}

Response:
{
  "message": "Verification email sent to your college email",
  "expires_at": "2024-03-21T14:25:00.000Z"
}
```

### Complete College Email Verification
```http
POST /auth/verify-college/callback?token=abc123def456...

Response:
{
  "message": "College email verified successfully",
  "verified": true
}
```

### Supabase Webhook
```http
POST /auth/webhooks/supabase
Content-Type: application/json

{
  "type": "user.created",
  "record": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john.doe@gmail.com",
    "created_at": "2024-03-15T10:30:00.000Z"
  }
}
```

## Authentication Flow

### User Registration & Authentication
1. User signs up via Supabase Auth (frontend)
2. Supabase webhook triggers user creation in our system
3. User is classified by email domain (student vs recruiter)
4. User receives JWT token from Supabase
5. JWT token is used for all API requests

### College Email Verification Flow (Students Only)
1. Student logs in with personal email
2. Student initiates college verification via `/auth/verify-college`
3. System validates college domain against allowed list
4. Verification token is generated and stored
5. Email is sent to student's college email (TODO: implement email service)
6. Student clicks verification link with token
7. System marks user as college-verified
8. Student gains access to job applications

### JWT Token Processing
1. Client sends request with Authorization header
2. JwtStrategy extracts and validates Supabase JWT
3. User is found/created in our database
4. Last login timestamp is updated
5. User object is attached to request context

## Security Features

### JWT Verification
- **Supabase JWKS**: Validates tokens using Supabase's public keys
- **Audience Validation**: Ensures token is for our application
- **Issuer Validation**: Confirms token came from Supabase
- **Expiration Check**: Automatically rejects expired tokens

### College Email Validation
- **Domain Whitelist**: Only approved college domains accepted
- **Token Expiration**: Verification tokens expire in 24 hours
- **Secure Token Generation**: Cryptographically secure random tokens
- **One-time Use**: Tokens are invalidated after use

### Role-Based Access Control
```typescript
// Protect routes by role
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)

// Require college verification for students
@UseGuards(JwtAuthGuard, CollegeVerifiedGuard)

// Multiple role access
@Roles(UserRole.RECRUITER, UserRole.ADMIN)
```

### Rate Limiting
- **Global Rate Limiting**: 100 requests per minute per IP
- **Sensitive Endpoints**: Stricter limits on auth endpoints
- **Redis Backend**: Distributed rate limiting across instances

## User Roles & Permissions

### Student Role
- **Base Access**: Read job listings, company profiles
- **After College Verification**: Submit applications, create profile
- **Restrictions**: Cannot post jobs, manage companies

### Recruiter Role
- **Access**: Post jobs, manage company profiles, review applications
- **Verification**: Email domain-based classification
- **Restrictions**: Cannot access admin functions

### Admin Role
- **Full Access**: All system functions
- **User Management**: Verify companies, manage users
- **System Access**: View analytics, system health

## College Verification System

### Eligible Colleges
- Tier-1 engineering colleges (IITs, NITs, IIITs)
- Premier management institutes (IIMs)
- Top universities and colleges
- Domain-based validation (e.g., @iitb.ac.in, @nitk.ac.in)

### Verification Process
1. Student provides college email address
2. System validates domain against whitelist
3. Secure verification token generated
4. Token sent via email (magic link)
5. Student clicks link to complete verification
6. Account status updated to verified

### Verification Benefits
- Access to job application system
- Enhanced profile visibility
- Priority in job matching algorithms
- Access to premium features

## Integration with Other Modules

### Applications Module
- **Verification Check**: Students must be college-verified to apply
- **User Context**: Application submissions include user information
- **Access Control**: Role-based application management

### Student Profiles Module
- **Profile Creation**: Requires authenticated student user
- **Verification Status**: Profile shows college verification status
- **Data Sync**: User information synced with profile data

### Jobs Module
- **Job Posting**: Requires recruiter or admin role
- **Job Management**: Ownership validation for job operations
- **Application Access**: Role-based job application viewing

### Companies Module
- **Company Creation**: Requires recruiter role
- **Verification Workflow**: Admin role for company verification
- **Domain Validation**: Company domain verification

## Webhook Event Handling

### User Created
```typescript
{
  "type": "user.created",
  "record": {
    "id": "uuid",
    "email": "user@domain.com",
    "created_at": "timestamp"
  }
}
```
- Creates user in our database
- Classifies role by email domain
- Sets initial verification status

### User Updated
```typescript
{
  "type": "user.updated", 
  "record": {
    "id": "uuid",
    "email": "new@domain.com"
  }
}
```
- Updates user information
- Re-validates email domain
- Updates role if domain changed

### User Deleted
```typescript
{
  "type": "user.deleted",
  "record": {
    "id": "uuid"
  }
}
```
- Soft deletes user from database
- Anonymizes personal data
- Maintains referential integrity

## Environment Configuration

### Required Environment Variables
```env
# Supabase Configuration
SUPABASE_PROJECT_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_JWT_AUDIENCE=authenticated

# Application JWT
JWT_SECRET=your-app-jwt-secret

# Database
DATABASE_URL=postgresql://...
```

## Usage Examples

### Protecting Routes
```typescript
@Controller('protected')
export class ProtectedController {
  @Get('student-only')
  @UseGuards(JwtAuthGuard, RolesGuard, CollegeVerifiedGuard)
  @Roles(UserRole.STUDENT)
  async studentEndpoint(@CurrentUser() user: User) {
    return { message: 'Hello verified student!', user };
  }

  @Get('recruiter-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  async recruiterAdminEndpoint(@CurrentUser() user: User) {
    return { message: 'Hello recruiter or admin!', user };
  }
}
```

### Client-Side Usage
```typescript
// Frontend authentication
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// API calls with token
const response = await fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

This module provides a robust foundation for authentication and authorization with seamless Supabase integration, comprehensive college verification, and flexible role-based access control.
