import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Req,
  ParseIntPipe,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiProduces,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationSearchDto,
  NotificationResponseDto,
  NotificationStatsDto,
  BulkNotificationDto,
} from './dto/notification.dto';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new notification',
    description:
      'Creates a single notification for a specific user or global audience',
  })
  @ApiBody({
    type: CreateNotificationDto,
    description: 'Notification creation details with delivery preferences',
    examples: {
      'User Notification': {
        summary: 'Direct user notification',
        value: {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Welcome to Super Squads!',
          message:
            'Thank you for joining our platform. Get started by creating your first squad.',
          type: 'welcome',
          priority: 'medium',
          channels: ['email', 'push'],
          metadata: {
            user_name: 'John Doe',
            action_url: '/dashboard',
          },
          template_data: {
            button_text: 'Get Started',
            company_name: 'Super Squads',
          },
        },
      },
      'Global Notification': {
        summary: 'System-wide announcement',
        value: {
          title: 'Scheduled Maintenance',
          message: 'System will be under maintenance on Sunday at 2 AM UTC.',
          type: 'system',
          priority: 'high',
          channels: ['email', 'push', 'sms'],
          metadata: {
            maintenance_duration: '2 hours',
            affected_services: ['API', 'Web App'],
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Notification created successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid notification data provided',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  async create(
    @Body(ValidationPipe) createNotificationDto: CreateNotificationDto,
    @Req() request: Request,
  ): Promise<NotificationResponseDto> {
    const adminUserId = request.user?.['sub'] || request.user?.['id'];
    return this.notificationsService.createNotification(createNotificationDto);
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Create bulk notifications',
    description: 'Creates multiple notifications at once for batch processing',
  })
  @ApiBody({
    type: BulkNotificationDto,
    description:
      'Bulk notification creation with recipient lists and templates',
    examples: {
      'User List Notification': {
        summary: 'Send to specific users',
        value: {
          user_ids: [
            '123e4567-e89b-12d3-a456-426614174000',
            '987fcdeb-51a2-43d1-9c5f-123456789abc',
          ],
          title: 'Monthly Newsletter',
          message: 'Check out our latest updates and features.',
          type: 'newsletter',
          priority: 'low',
          channels: ['email'],
          template: 'newsletter_template',
          template_data: {
            month: 'January',
            year: '2024',
            featured_content: 'AI-powered squad matching',
          },
        },
      },
      'All Users Notification': {
        summary: 'Broadcast to all users',
        value: {
          title: 'New Feature Available',
          message: 'Squad video calls are now available!',
          type: 'feature_announcement',
          priority: 'medium',
          channels: ['push', 'in_app'],
          send_to_all: true,
          metadata: {
            feature_name: 'Video Calls',
            release_date: '2024-01-15',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bulk notifications created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        created_count: { type: 'number', example: 150 },
        failed_count: { type: 'number', example: 5 },
        notification_ids: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          example: [
            '550e8400-e29b-41d4-a716-446655440000',
            '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          ],
        },
        failed_user_ids: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          example: ['invalid-user-id'],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid bulk notification data',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  async createBulk(
    @Body(ValidationPipe) bulkNotificationDto: BulkNotificationDto,
    @Req() request: Request,
  ) {
    const adminUserId = request.user?.['sub'] || request.user?.['id'];
    return this.notificationsService.createBulkNotifications(
      bulkNotificationDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get current user notifications',
    description:
      'Retrieves notifications for the authenticated user with filtering and pagination',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of notifications per page',
    example: 20,
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: [
      'welcome',
      'reminder',
      'alert',
      'newsletter',
      'system',
      'feature_announcement',
      'promotion',
    ],
    description: 'Filter by notification type',
    example: 'reminder',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    description: 'Filter by notification status',
    example: 'delivered',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: ['low', 'medium', 'high', 'urgent'],
    description: 'Filter by notification priority',
    example: 'high',
  })
  @ApiQuery({
    name: 'read',
    required: false,
    type: Boolean,
    description: 'Filter by read status',
    example: false,
  })
  @ApiQuery({
    name: 'from_date',
    required: false,
    type: String,
    format: 'date-time',
    description: 'Start date for filtering (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'to_date',
    required: false,
    type: String,
    format: 'date-time',
    description: 'End date for filtering (ISO 8601)',
    example: '2024-01-31T23:59:59Z',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User notifications retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        notifications: {
          type: 'array',
          items: { $ref: '#/components/schemas/NotificationResponseDto' },
        },
        total: { type: 'number', example: 45 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
        total_pages: { type: 'number', example: 3 },
        unread_count: { type: 'number', example: 12 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiProduces('application/json')
  async findUserNotifications(
    @Query() searchDto: NotificationSearchDto,
    @Req() request: Request,
  ) {
    const userId = request.user?.['sub'] || request.user?.['id'];
    return this.notificationsService.getUserNotifications(userId, searchDto);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get notification statistics',
    description: 'Retrieves comprehensive statistics about user notifications',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification statistics retrieved successfully',
    type: NotificationStatsDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiProduces('application/json')
  async getStats(@Req() request: Request): Promise<NotificationStatsDto> {
    const userId = request.user?.['sub'] || request.user?.['id'];
    return this.notificationsService.getNotificationStats(userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get notification by ID',
    description: 'Retrieves a specific notification by its UUID',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Notification UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification found and retrieved successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiProduces('application/json')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<NotificationResponseDto> {
    const userId = request.user?.['sub'] || request.user?.['id'];
    return this.notificationsService.getNotificationById(id, userId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update notification',
    description: 'Updates notification settings or status (admin only)',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Notification UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateNotificationDto,
    description: 'Notification update data',
    examples: {
      'Update Priority': {
        summary: 'Change notification priority',
        value: {
          priority: 'urgent',
          metadata: {
            escalated_by: 'admin',
            escalation_reason: 'Security alert',
          },
        },
      },
      'Mark as Read': {
        summary: 'Update read status',
        value: {
          read_at: '2024-01-15T10:30:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification updated successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid update data',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateNotificationDto: UpdateNotificationDto,
    @Req() request: Request,
  ): Promise<NotificationResponseDto> {
    const userId = request.user?.['sub'] || request.user?.['id'];
    return this.notificationsService.updateNotification(
      id,
      updateNotificationDto,
    );
  }

  @Post(':id/read')
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Marks a specific notification as read by the current user',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Notification UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as read successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        read_at: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00Z',
        },
        notification: { $ref: '#/components/schemas/NotificationResponseDto' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  @ApiProduces('application/json')
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const userId = request.user?.['sub'] || request.user?.['id'];
    return this.notificationsService.markAsRead(id, userId);
  }

  @Post('read-all')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Marks all unread notifications for the current user as read',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All notifications marked as read successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        updated_count: { type: 'number', example: 15 },
        read_at: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiProduces('application/json')
  async markAllAsRead(@Req() request: Request) {
    const userId = request.user?.['sub'] || request.user?.['id'];
    return this.notificationsService.markAllAsRead(userId);
  }

  @Post(':id/retry')
  @ApiOperation({
    summary: 'Retry failed notification',
    description: 'Retries sending a failed notification (admin only)',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Notification UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification retry initiated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        retry_count: { type: 'number', example: 2 },
        status: { type: 'string', example: 'pending' },
        notification: { $ref: '#/components/schemas/NotificationResponseDto' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Notification cannot be retried (not failed or max retries reached)',
  })
  @ApiProduces('application/json')
  async retry(@Param('id', ParseUUIDPipe) id: string, @Req() request: Request) {
    const adminUserId = request.user?.['sub'] || request.user?.['id'];
    return this.notificationsService.retryNotification(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete notification',
    description: 'Soft deletes a notification (admin only)',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Notification UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Notification deleted successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiProduces('application/json')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const adminUserId = request.user?.['sub'] || request.user?.['id'];
    return this.notificationsService.deleteNotification(id, adminUserId);
  }
}
