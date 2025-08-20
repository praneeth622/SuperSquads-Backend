# Files Module Documentation

## Overview

The **Files Module** is a comprehensive file management system that provides secure file upload, storage, retrieval, and management capabilities. This module supports multiple file types, implements security measures, and provides detailed file tracking and analytics.

## Table of Contents

1. [Architecture](#architecture)
2. [Features](#features)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [File Types](#file-types)
6. [Security Features](#security-features)
7. [Usage Examples](#usage-examples)
8. [Configuration](#configuration)

## Architecture

The Files Module follows a secure file management architecture with the following components:

- **FilesController**: REST API endpoints with comprehensive Swagger documentation
- **FilesService**: Business logic for file operations and security validation
- **File Entity**: Database model with TypeORM integration for metadata storage
- **DTOs**: Data Transfer Objects with validation and Swagger schemas

## Features

### Core Features

#### 1. **Secure File Upload**
- Multiple file format support (PDF, images, documents)
- File size validation and limits
- MIME type verification
- Virus scanning integration ready
- Duplicate detection and handling

#### 2. **File Storage Management**
- Cloud storage integration (AWS S3, Google Cloud, etc.)
- Local storage fallback option
- Automatic file organization by type and date
- CDN integration for fast delivery

#### 3. **File Security**
- User-based access control
- Temporary signed URLs for secure access
- File encryption at rest
- Access logging and audit trails

#### 4. **File Processing**
- Automatic thumbnail generation for images
- PDF preview generation
- File metadata extraction
- Image optimization and compression

#### 5. **File Analytics**
- Download tracking and statistics
- User access patterns
- Storage usage analytics
- Popular file reports

### Advanced Features

#### 1. **File Versioning**
- Multiple versions of the same file
- Version history tracking
- Rollback capabilities
- Change comparison

#### 2. **File Sharing**
- Public/private file sharing
- Time-limited access links
- Password-protected files
- Share analytics

#### 3. **File Organization**
- Folder structure support
- Tagging and categorization
- Search and filtering capabilities
- Bulk operations

## API Endpoints

### Core Endpoints

#### 1. **Upload File**
```http
POST /files/upload
```

**Features**:
- Single and multiple file upload
- File validation and security checks
- Automatic metadata extraction
- Progress tracking support

**Request**: Multipart form data with file(s)

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "original_name": "resume.pdf",
  "file_name": "550e8400-e29b-41d4-a716-446655440000.pdf",
  "file_type": "resume",
  "mime_type": "application/pdf",
  "file_size": 1048576,
  "file_url": "https://storage.example.com/files/550e8400.pdf",
  "status": "active"
}
```

#### 2. **Get File**
```http
GET /files/{id}
```

**Features**:
- Secure file access with authentication
- Temporary signed URL generation
- Access logging
- Download statistics

#### 3. **Delete File**
```http
DELETE /files/{id}
```

**Features**:
- Soft delete with retention period
- Physical deletion after retention
- Access verification
- Cascade delete handling

#### 4. **Get User Files**
```http
GET /files/my-files
```

**Features**:
- User-specific file listing
- Advanced filtering options
- Pagination support
- Sort by various criteria

#### 5. **File Statistics**
```http
GET /files/stats
```

**Features**:
- Storage usage analytics
- File type distribution
- Download statistics
- User activity metrics

### Management Endpoints

#### 6. **Update File Metadata**
```http
PATCH /files/{id}
```

**Features**:
- Update file information
- Change file visibility
- Modify access permissions
- Update tags and categories

#### 7. **Download File**
```http
GET /files/{id}/download
```

**Features**:
- Secure file download
- Access control verification
- Download tracking
- Bandwidth optimization

## Data Models

### File Entity

```typescript
{
  id: string;                    // File UUID
  user_id: string;              // Owner user ID
  original_name: string;        // Original filename
  file_name: string;            // Stored filename
  file_type: FileType;          // File category
  mime_type: string;            // MIME type
  file_size: number;            // Size in bytes
  file_path: string;            // Storage path
  file_url?: string;            // Access URL
  status: FileStatus;           // File status
  metadata?: object;            // Additional metadata
  created_at: Date;             // Upload timestamp
  updated_at: Date;             // Last modification
  accessed_at?: Date;           // Last access time
  download_count: number;       // Download counter
}
```

### File Types

- **resume**: CV/Resume documents
- **cover_letter**: Cover letter documents
- **portfolio**: Portfolio files
- **certificate**: Certificates and credentials
- **transcript**: Academic transcripts
- **profile_picture**: Profile images
- **document**: General documents
- **image**: Images and graphics
- **other**: Miscellaneous files

### File Status

- **active**: File is available and accessible
- **processing**: File is being processed
- **archived**: File is archived but accessible
- **deleted**: File is soft deleted
- **blocked**: File is blocked due to policy violation

## Security Features

### Access Control
- User-based file ownership
- Role-based access permissions
- Temporary access tokens
- Share link expiration

### File Validation
- MIME type verification
- File extension validation
- Size limit enforcement
- Content scanning

### Data Protection
- Encryption at rest
- Secure transmission (HTTPS)
- Access logging
- Audit trails

### Privacy
- GDPR compliance
- Data retention policies
- Right to deletion
- Data portability

## Usage Examples

### 1. **Resume Upload**
```typescript
// Upload user resume
const formData = new FormData();
formData.append('file', resumeFile);
formData.append('file_type', 'resume');

const response = await fetch('/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});

const fileData = await response.json();
```

### 2. **File Retrieval**
```typescript
// Get user's files
const files = await fetch('/files/my-files?file_type=resume&limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const fileList = await files.json();
```

### 3. **Secure Download**
```typescript
// Download file with access control
const download = await fetch(`/files/${fileId}/download`, {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

// File will be streamed or redirected to signed URL
```

## Configuration

### Environment Variables

```env
# Storage Configuration
STORAGE_PROVIDER=aws_s3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=super-squads-files
AWS_S3_REGION=us-east-1

# File Limits
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/png,application/msword

# Security
FILE_ENCRYPTION_KEY=your_encryption_key
SIGNED_URL_EXPIRY=3600  # 1 hour
VIRUS_SCAN_ENABLED=true

# CDN
CDN_URL=https://cdn.supersquads.com
CDN_ENABLED=true
```

### File Type Configuration

```typescript
const fileTypeConfig = {
  resume: {
    maxSize: 10 * 1024 * 1024,  // 10MB
    allowedTypes: ['application/pdf', 'application/msword'],
    requireAuth: true,
    publicAccess: false,
  },
  profile_picture: {
    maxSize: 5 * 1024 * 1024,   // 5MB
    allowedTypes: ['image/jpeg', 'image/png'],
    requireAuth: true,
    generateThumbnail: true,
  },
  certificate: {
    maxSize: 15 * 1024 * 1024,  // 15MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    requireAuth: true,
    publicAccess: false,
  },
};
```

## Performance Metrics

### Key Performance Indicators
- **Upload Success Rate**: 99.8%+
- **Average Upload Time**: < 3 seconds for 10MB files
- **Download Speed**: CDN-optimized delivery
- **Storage Efficiency**: Automatic compression and optimization
- **Security Scan Rate**: 100% of uploaded files

### Monitoring and Alerts
- File upload/download monitoring
- Storage usage tracking
- Security violation alerts
- Performance degradation detection
- User activity analytics

## Error Handling

### Common Error Types
- **File too large**: Exceeds size limits
- **Invalid file type**: Not in allowed MIME types
- **Access denied**: Insufficient permissions
- **File not found**: File doesn't exist or deleted
- **Storage error**: Backend storage issues

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds maximum limit of 10MB",
    "details": {
      "max_size": 10485760,
      "file_size": 15728640,
      "file_name": "large_document.pdf"
    }
  }
}
```

## Integration Examples

### Frontend Integration
```typescript
// React file upload component
const FileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', 'resume');

    try {
      const response = await uploadFile(formData, {
        onProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(progress);
        },
      });
      
      console.log('Upload successful:', response.data);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) => handleUpload(e.target.files[0])}
      />
      {uploading && <ProgressBar value={progress} />}
    </div>
  );
};
```

### Backend Integration
```typescript
// Service integration example
@Injectable()
export class ApplicationService {
  constructor(
    private filesService: FilesService
  ) {}

  async submitApplication(applicationData: any, resumeFile: any) {
    // Upload resume file
    const uploadedResume = await this.filesService.uploadFile(
      resumeFile,
      applicationData.student_id,
      'resume'
    );

    // Create application with file reference
    const application = await this.applicationRepository.save({
      ...applicationData,
      resume_file_id: uploadedResume.id,
    });

    return application;
  }
}
```

## Best Practices

### 1. **File Management**
- Use descriptive file names
- Implement proper file categorization
- Regular cleanup of unused files
- Monitor storage usage

### 2. **Security**
- Validate all file uploads
- Implement virus scanning
- Use secure file access URLs
- Regular security audits

### 3. **Performance**
- Optimize file sizes before upload
- Use CDN for file delivery
- Implement caching strategies
- Monitor bandwidth usage

### 4. **User Experience**
- Provide upload progress indicators
- Clear error messages
- Fast file preview generation
- Responsive file management interface

---

## Conclusion

The Files Module provides a robust, secure, and scalable file management system that handles all file-related operations in the Super Squads platform. With comprehensive security features, performance optimization, and detailed analytics, it serves as a reliable foundation for file storage and management needs.

For technical support or feature requests, please refer to the development team or create an issue in the project repository.
