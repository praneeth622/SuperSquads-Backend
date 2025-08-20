import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsObject,
  IsNumber,
  IsDateString,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  IN_APP = 'in_app',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
}

export enum NotificationTemplate {
  APPLICATION_SUBMITTED = 'application_submitted',
  APPLICATION_STATUS_CHANGED = 'application_status_changed',
  JOB_MATCH = 'job_match',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  PROFILE_VIEWED = 'profile_viewed',
  MESSAGE_RECEIVED = 'message_received',
  DEADLINE_REMINDER = 'deadline_reminder',
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class CreateNotificationDto {
  @ApiProperty({
    description: 'ID of the user who will receive the notification',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID(4)
  recipient_id: string;

  @ApiProperty({
    description: 'Type of notification delivery method',
    enum: NotificationType,
    example: NotificationType.EMAIL,
    enumName: 'NotificationType',
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Template identifier for the notification',
    enum: NotificationTemplate,
    example: NotificationTemplate.APPLICATION_SUBMITTED,
    enumName: 'NotificationTemplate',
  })
  @IsEnum(NotificationTemplate)
  template: NotificationTemplate;

  @ApiProperty({
    description:
      'Subject line for the notification (email subject, push title, etc.)',
    example: 'Your application has been submitted successfully',
    maxLength: 255,
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'Main content/body of the notification',
    example:
      'Hello John, your application for Software Engineer at TechCorp has been submitted and is now under review.',
  })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'Template variables and additional data for the notification',
    type: 'object',
    additionalProperties: true,
    example: {
      job_title: 'Software Engineer',
      company_name: 'TechCorp',
      application_id: '456e7890-e89b-12d3-a456-426614174001',
      deadline: '2024-02-15T23:59:59.000Z',
    },
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Priority level of the notification',
    enum: NotificationPriority,
    example: NotificationPriority.NORMAL,
    default: NotificationPriority.NORMAL,
    enumName: 'NotificationPriority',
  })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({
    description:
      'Schedule the notification to be sent at a specific time (ISO 8601 format)',
    example: '2024-01-20T09:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;
}

export class UpdateNotificationDto {
  @ApiPropertyOptional({
    description: 'Update notification delivery status',
    enum: NotificationStatus,
    example: NotificationStatus.SENT,
    enumName: 'NotificationStatus',
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({
    description: 'External provider message ID for tracking',
    example: 'aws-ses-msg-123456789',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  external_id?: string;

  @ApiPropertyOptional({
    description: 'Error message if notification delivery failed',
    example: 'SMTP connection timeout',
  })
  @IsOptional()
  @IsString()
  error_message?: string;

  @ApiPropertyOptional({
    description: 'Number of delivery attempts',
    example: 3,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  retry_count?: number;

  @ApiPropertyOptional({
    description: 'Timestamp when notification was sent (ISO 8601 format)',
    example: '2024-01-15T14:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  sent_at?: string;

  @ApiPropertyOptional({
    description: 'Timestamp when notification was delivered (ISO 8601 format)',
    example: '2024-01-15T14:31:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  delivered_at?: string;

  @ApiPropertyOptional({
    description:
      'Timestamp when notification was opened/read (ISO 8601 format)',
    example: '2024-01-15T15:45:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  opened_at?: string;

  @ApiPropertyOptional({
    description:
      'Timestamp when notification action was clicked (ISO 8601 format)',
    example: '2024-01-15T15:46:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  clicked_at?: string;
}

export class NotificationSearchDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination (starts from 1)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of notifications per page (max 100)',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by notification type',
    enum: NotificationType,
    example: NotificationType.EMAIL,
    enumName: 'NotificationType',
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({
    description: 'Filter by notification status',
    enum: NotificationStatus,
    example: NotificationStatus.SENT,
    enumName: 'NotificationStatus',
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({
    description: 'Filter by notification template',
    enum: NotificationTemplate,
    example: NotificationTemplate.APPLICATION_SUBMITTED,
    enumName: 'NotificationTemplate',
  })
  @IsOptional()
  @IsEnum(NotificationTemplate)
  template?: NotificationTemplate;

  @ApiPropertyOptional({
    description:
      'Filter notifications created after this date (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  created_after?: string;

  @ApiPropertyOptional({
    description:
      'Filter notifications created before this date (ISO 8601 format)',
    example: '2024-12-31T23:59:59.999Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  created_before?: string;

  @ApiPropertyOptional({
    description: 'Filter by read status (in-app notifications)',
    example: false,
    type: 'boolean',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_read?: boolean;

  @ApiPropertyOptional({
    description: 'Search in notification content and subject',
    example: 'application',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ['created_at', 'sent_at', 'delivered_at', 'subject'],
    example: 'created_at',
    default: 'created_at',
  })
  @IsOptional()
  @IsString()
  sort_by?: 'created_at' | 'sent_at' | 'delivered_at' | 'subject' =
    'created_at';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';
}

export class NotificationResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the notification',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'ID of the user who received the notification',
    example: '456e7890-e89b-12d3-a456-426614174001',
  })
  recipient_id: string;

  @ApiProperty({
    description: 'Type of notification delivery method',
    enum: NotificationType,
    example: NotificationType.EMAIL,
  })
  type: NotificationType;

  @ApiProperty({
    description: 'Template identifier for the notification',
    example: 'application_submitted',
  })
  template: string;

  @ApiProperty({
    description: 'Subject line of the notification',
    example: 'Your application has been submitted successfully',
  })
  subject: string;

  @ApiProperty({
    description: 'Main content/body of the notification',
    example:
      'Hello John, your application for Software Engineer at TechCorp has been submitted and is now under review.',
  })
  content: string;

  @ApiPropertyOptional({
    description: 'Template variables and additional data',
    type: 'object',
    additionalProperties: true,
    example: {
      job_title: 'Software Engineer',
      company_name: 'TechCorp',
      application_id: '456e7890-e89b-12d3-a456-426614174001',
    },
  })
  payload?: Record<string, any>;

  @ApiProperty({
    description: 'Current delivery status of the notification',
    enum: NotificationStatus,
    example: NotificationStatus.DELIVERED,
  })
  status: NotificationStatus;

  @ApiPropertyOptional({
    description: 'External provider message ID',
    example: 'aws-ses-msg-123456789',
  })
  external_id?: string;

  @ApiPropertyOptional({
    description: 'Error message if delivery failed',
    example: null,
  })
  error_message?: string;

  @ApiProperty({
    description: 'Number of delivery attempts',
    example: 1,
  })
  retry_count: number;

  @ApiPropertyOptional({
    description: 'Timestamp when notification was sent',
    example: '2024-01-15T14:30:00.000Z',
  })
  sent_at?: string;

  @ApiPropertyOptional({
    description: 'Timestamp when notification was delivered',
    example: '2024-01-15T14:31:00.000Z',
  })
  delivered_at?: string;

  @ApiPropertyOptional({
    description: 'Timestamp when notification was opened/read',
    example: '2024-01-15T15:45:00.000Z',
  })
  opened_at?: string;

  @ApiPropertyOptional({
    description: 'Timestamp when notification action was clicked',
    example: '2024-01-15T15:46:00.000Z',
  })
  clicked_at?: string;

  @ApiProperty({
    description: 'Timestamp when notification was created',
    example: '2024-01-15T14:29:00.000Z',
  })
  created_at: string;

  @ApiProperty({
    description: 'Timestamp when notification was last updated',
    example: '2024-01-15T15:45:00.000Z',
  })
  updated_at: string;

  @ApiPropertyOptional({
    description:
      'Whether the notification has been read (for in-app notifications)',
    example: true,
    type: 'boolean',
  })
  is_read?: boolean;
}

export class NotificationStatsDto {
  @ApiProperty({
    description: 'Total number of notifications',
    example: 1250,
  })
  total_notifications: number;

  @ApiProperty({
    description: 'Number of notifications by type',
    example: {
      email: 800,
      push: 300,
      sms: 50,
      in_app: 100,
    },
  })
  by_type: Record<NotificationType, number>;

  @ApiProperty({
    description: 'Number of notifications by status',
    example: {
      pending: 25,
      sent: 50,
      delivered: 1150,
      failed: 20,
      bounced: 5,
    },
  })
  by_status: Record<NotificationStatus, number>;

  @ApiProperty({
    description: 'Number of notifications by template',
    example: {
      application_submitted: 400,
      application_status_changed: 300,
      job_match: 200,
      interview_scheduled: 150,
      profile_viewed: 100,
      message_received: 50,
      deadline_reminder: 30,
      welcome: 15,
      password_reset: 3,
      email_verification: 2,
    },
  })
  by_template: Record<string, number>;

  @ApiProperty({
    description: 'Delivery success rate as percentage',
    example: 94.5,
  })
  delivery_rate: number;

  @ApiProperty({
    description: 'Open rate for delivered notifications as percentage',
    example: 67.8,
  })
  open_rate: number;

  @ApiProperty({
    description: 'Click-through rate as percentage',
    example: 23.4,
  })
  click_rate: number;

  @ApiProperty({
    description: 'Recent notifications count (last 24 hours)',
    example: 45,
  })
  recent_notifications: number;

  @ApiProperty({
    description: 'Failed notifications requiring attention',
    example: 8,
  })
  failed_notifications: number;

  @ApiProperty({
    description: 'Average delivery time in seconds',
    example: 2.3,
  })
  avg_delivery_time: number;
}

export class BulkNotificationDto {
  @ApiProperty({
    description: 'List of recipient user IDs',
    type: [String],
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '456e7890-e89b-12d3-a456-426614174001',
      '789e1234-e89b-12d3-a456-426614174002',
    ],
  })
  @IsUUID(4, { each: true })
  recipient_ids: string[];

  @ApiProperty({
    description: 'Type of notification delivery method',
    enum: NotificationType,
    example: NotificationType.EMAIL,
    enumName: 'NotificationType',
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Template identifier for the notification',
    enum: NotificationTemplate,
    example: NotificationTemplate.DEADLINE_REMINDER,
    enumName: 'NotificationTemplate',
  })
  @IsEnum(NotificationTemplate)
  template: NotificationTemplate;

  @ApiProperty({
    description: 'Subject line for all notifications',
    example: 'Application deadline reminder - 24 hours left',
    maxLength: 255,
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'Base content template (will be personalized per recipient)',
    example:
      'Hello {{name}}, this is a reminder that the application deadline for {{job_title}} at {{company_name}} is in 24 hours.',
  })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'Common template variables for all notifications',
    type: 'object',
    additionalProperties: true,
    example: {
      job_title: 'Software Engineer',
      company_name: 'TechCorp',
      deadline: '2024-02-15T23:59:59.000Z',
    },
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Priority level of the notifications',
    enum: NotificationPriority,
    example: NotificationPriority.HIGH,
    default: NotificationPriority.NORMAL,
    enumName: 'NotificationPriority',
  })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;
}
