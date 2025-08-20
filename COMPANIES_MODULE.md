# Companies Module

## Overview
The Companies module provides comprehensive company management functionality for recruiters and administrators. It handles company profile creation, verification workflows, search capabilities, and analytics with role-based access control.

## Features Implemented

### 1. Companies DTOs (`/src/companies/dto/company.dto.ts`)
- **CreateCompanyDto**: Complete company profile creation with website, domain, industry, and size validation
- **UpdateCompanyDto**: Partial updates with conflict resolution for domains
- **CompanySearchDto**: Advanced search with industry, size, verification status filters
- **CompanyResponseDto**: Comprehensive company response with optional statistics
- **CompanyListResponseDto**: Paginated company listings with metadata
- **CompanyStatsDto**: System-wide company analytics and industry distribution

### 2. Companies Service (`/src/companies/companies.service.ts`)
- **Company Management**:
  - `createCompany()`: Create company with duplicate name/domain validation
  - `updateCompany()`: Update company with role-based verification controls
  - `getCompanyById()`: Get company details with optional statistics
  - `getCompanyByDomain()`: Find company by domain (used for verification)
  - `deleteCompany()`: Delete company with active jobs validation

- **Search & Discovery**:
  - `searchCompanies()`: Advanced search with multiple filters
  - `getVerifiedCompanies()`: Get only verified companies for job listings
  - Filter support: industry, company size, verification status, text search
  - Sorting options with pagination

- **Admin Features**:
  - `getPendingVerification()`: Get companies awaiting verification
  - `verifyCompany()`: Mark company as verified (admin only)
  - `rejectCompany()`: Reject company verification (admin only)
  - `getCompanyStats()`: System-wide analytics

- **Business Logic**:
  - Duplicate prevention for company names and domains
  - Verification workflow (new companies start unverified)
  - Active jobs validation before deletion
  - Statistics calculation for company profiles

### 3. Companies Controller (`/src/companies/companies.controller.ts`)
- **Public Endpoints**:
  - `GET /companies`: Search companies with filters
  - `GET /companies/verified`: Get verified companies only
  - `GET /companies/:id`: Get company details by ID

- **Recruiter/Admin Endpoints** (Authentication + RECRUITER/ADMIN role):
  - `POST /companies`: Create new company profile
  - `PATCH /companies/:id`: Update company details

- **Admin-Only Endpoints** (Authentication + ADMIN role):
  - `GET /companies/pending-verification`: Get companies awaiting verification
  - `GET /companies/stats`: Get system-wide company statistics
  - `PATCH /companies/:id/verify`: Verify company
  - `PATCH /companies/:id/reject`: Reject company verification
  - `DELETE /companies/:id`: Delete company

- **Security Features**:
  - JWT authentication for protected endpoints
  - Role-based access control
  - Verification workflow controls
  - Conflict prevention for domains

### 4. Companies Module (`/src/companies/companies.module.ts`)
- Registers Company, Job, and Application entities with TypeORM
- Exports CompaniesService for use in other modules
- Integrates with job and application systems for statistics

## API Documentation

### Company Search
```http
GET /companies?search=tech&industry=Technology&company_size=51-200&is_verified=true&page=1&limit=20
```

**Query Parameters:**
- `search`: Search query (company name, description)
- `industry`: Filter by industry
- `company_size`: Filter by company size (1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5000+)
- `is_verified`: Filter by verification status
- `sort_by`: Sort field (name, created_at, updated_at)
- `sort_order`: Sort direction (asc, desc)
- `page`: Page number for pagination
- `limit`: Results per page

### Create Company
```http
POST /companies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "TechCorp Solutions",
  "website": "https://techcorp.com",
  "domain": "techcorp.com",
  "description": "Leading technology company focused on innovative software solutions for enterprises. We specialize in cloud infrastructure, AI/ML solutions, and fintech applications.",
  "logo_url": "https://techcorp.com/logo.png",
  "industry": "Technology",
  "company_size": "51-200",
  "headquarters": "San Francisco, CA, USA"
}
```

### Update Company
```http
PATCH /companies/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Updated company description",
  "company_size": "201-500",
  "headquarters": "New York, NY, USA"
}
```

### Get Company with Statistics
```http
GET /companies/:id?include_stats=true
```

**Response includes:**
- Basic company information
- `total_jobs`: Total jobs posted by company
- `active_jobs`: Currently active job postings
- `total_applications`: Total applications received

## Company Verification Workflow

### New Company Registration
1. Recruiter creates company profile via `POST /companies`
2. Company is created with `is_verified: false`
3. Company appears in pending verification queue
4. Admin reviews and verifies/rejects company

### Admin Verification Process
1. Admin views pending companies via `GET /companies/pending-verification`
2. Admin reviews company details
3. Admin either:
   - Verifies: `PATCH /companies/:id/verify`
   - Rejects: `PATCH /companies/:id/reject` (with optional reason)

### Verification Benefits
- Verified companies appear in public company searches
- Only verified companies can have active job postings
- Verification status is displayed to users

## Company Size Categories
- **1-10**: Startup/Small business
- **11-50**: Small company
- **51-200**: Medium company
- **201-500**: Large company
- **501-1000**: Very large company
- **1001-5000**: Enterprise
- **5000+**: Mega enterprise

## Industry Categories
- Technology
- Finance
- Healthcare
- Education
- E-commerce
- Manufacturing
- Consulting
- Media & Entertainment
- Real Estate
- Non-profit
- Government
- Other

## Security Features

### Authentication & Authorization
- JWT token-based authentication for protected endpoints
- Role-based access control (RECRUITER, ADMIN roles)
- Admin-only verification controls

### Data Validation
- Comprehensive DTO validation with class-validator
- Duplicate prevention for company names and domains
- Website URL validation
- Required field validation

### Business Rules
- New companies start unverified
- Only admins can change verification status
- Cannot delete companies with active jobs
- Domain uniqueness enforcement

## Integration with Other Modules

### Jobs Module
- Company validation during job creation
- Company details included in job responses
- Company-based job filtering
- Active jobs tracking for deletion validation

### Applications Module
- Company information in application responses
- Application statistics by company
- Company reputation tracking

### Users Module
- Recruiter association with companies
- Company domain verification for email validation

## Analytics & Statistics

### Company Statistics
- Total companies in system
- Verified vs unverified companies
- Companies pending verification
- Top industries by company count
- Company size distribution

### Performance Metrics
- Job posting activity by company
- Application volumes by company
- Company growth trends
- Verification processing times

## Usage Examples

### Company Discovery Flow
1. User visits company directory
2. Applies filters (industry, size, location)
3. System returns verified companies matching criteria
4. User clicks company for detailed profile
5. Profile shows company info + job statistics

### Recruiter Company Management Flow
1. Recruiter signs up and creates company profile
2. Company is created in unverified state
3. Admin reviews and verifies company
4. Recruiter can now post jobs under verified company
5. Company profile shows job posting statistics

### Admin Verification Flow
1. Admin accesses pending verification queue
2. Reviews company details and website
3. Verifies legitimate companies
4. Rejects suspicious or incomplete profiles
5. Monitors company statistics and trends

This module provides a robust foundation for company management with comprehensive verification workflows, detailed analytics, and seamless integration with the job posting ecosystem.
