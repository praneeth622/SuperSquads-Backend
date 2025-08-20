import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In, Between } from 'typeorm';
import {
  Notification,
  NotificationType as EntityNotificationType,
  NotificationStatus as EntityNotificationStatus,
} from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationSearchDto,
  BulkNotificationDto,
  NotificationType,
  NotificationStatus,
  NotificationTemplate,
  NotificationPriority,
} from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a single notification
   */
  async createNotification(createDto: CreateNotificationDto): Promise<any> {
    // Validate recipient exists
    const recipient = await this.userRepository.findOne({
      where: { id: createDto.recipient_id },
    });

    if (!recipient) {
      throw new NotFoundException('Recipient user not found');
    }

    // Create notification entity
    const notification = new Notification();
    notification.recipient_id = createDto.recipient_id;
    notification.type = this.mapNotificationType(createDto.type);
    notification.template = createDto.template;
    notification.subject = createDto.subject;
    notification.content = createDto.content;
    notification.payload = createDto.payload || {};
    notification.status = EntityNotificationStatus.PENDING;

    // Add priority and scheduling to payload
    if (createDto.priority) {
      notification.payload = {
        ...notification.payload,
        priority: createDto.priority,
      };
    }

    if (createDto.scheduled_at) {
      notification.payload = {
        ...notification.payload,
        scheduled_at: createDto.scheduled_at,
      };
    }

    const savedNotification =
      await this.notificationRepository.save(notification);

    // Trigger async delivery (would integrate with actual notification providers)
    this.processNotificationAsync(savedNotification.id);

    return this.transformNotificationToDto(savedNotification);
  }

  /**
   * Create multiple notifications for bulk sending
   */
  async createBulkNotifications(bulkDto: BulkNotificationDto): Promise<{
    notifications: any[];
    total_created: number;
    failed_recipients: string[];
  }> {
    // Validate all recipients exist
    const recipients = await this.userRepository.find({
      where: { id: In(bulkDto.recipient_ids) },
    });

    const foundRecipientIds = recipients.map((r) => r.id);
    const failedRecipientIds = bulkDto.recipient_ids.filter(
      (id) => !foundRecipientIds.includes(id),
    );

    // Create notifications for valid recipients
    const notifications: Notification[] = [];

    for (const recipientId of foundRecipientIds) {
      const notification = new Notification();
      notification.recipient_id = recipientId;
      notification.type = this.mapNotificationType(bulkDto.type);
      notification.template = bulkDto.template;
      notification.subject = bulkDto.subject;
      notification.content = bulkDto.content;
      notification.payload = {
        ...(bulkDto.payload || {}),
        priority: bulkDto.priority || NotificationPriority.NORMAL,
        bulk_id: `bulk_${Date.now()}`, // Group bulk notifications
      };
      notification.status = EntityNotificationStatus.PENDING;
      notifications.push(notification);
    }

    const savedNotifications =
      await this.notificationRepository.save(notifications);

    // Trigger async delivery for all notifications
    savedNotifications.forEach((notification) => {
      this.processNotificationAsync(notification.id);
    });

    return {
      notifications: savedNotifications.map((n) =>
        this.transformNotificationToDto(n),
      ),
      total_created: savedNotifications.length,
      failed_recipients: failedRecipientIds,
    };
  }

  /**
   * Get user notifications with filtering and pagination
   */
  async getUserNotifications(
    userId: string,
    searchDto: NotificationSearchDto,
  ): Promise<{
    notifications: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unread_count: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = searchDto;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.recipient_id = :userId', { userId });

    // Apply filters
    this.applySearchFilters(queryBuilder, searchDto);

    // Apply sorting
    const sortField = this.validateSortField(sort_by);
    queryBuilder.orderBy(
      `notification.${sortField}`,
      sort_order.toUpperCase() as 'ASC' | 'DESC',
    );

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [notifications, total] = await queryBuilder.getManyAndCount();

    // Get unread count (for in-app notifications)
    const unreadCount = await this.notificationRepository.count({
      where: {
        recipient_id: userId,
        type: EntityNotificationType.IN_APP,
        opened_at: null as any, // TypeORM issue with null checks
      },
    });

    return {
      notifications: notifications.map((n) =>
        this.transformNotificationToDto(n),
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unread_count: unreadCount,
    };
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(
    notificationId: string,
    userId?: string,
  ): Promise<any> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.id = :notificationId', { notificationId });

    // If userId provided, ensure user can only access their own notifications
    if (userId) {
      queryBuilder.andWhere('notification.recipient_id = :userId', { userId });
    }

    const notification = await queryBuilder.getOne();

    if (!notification) {
      throw new NotFoundException('Notification not found or access denied');
    }

    return this.transformNotificationToDto(notification);
  }

  /**
   * Update notification status and tracking data
   */
  async updateNotification(
    notificationId: string,
    updateDto: UpdateNotificationDto,
  ): Promise<any> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Update fields
    if (updateDto.status !== undefined) {
      notification.status = this.mapNotificationStatus(updateDto.status);
    }

    if (updateDto.external_id !== undefined) {
      notification.external_id = updateDto.external_id;
    }

    if (updateDto.error_message !== undefined) {
      notification.error_message = updateDto.error_message;
    }

    if (updateDto.retry_count !== undefined) {
      notification.retry_count = updateDto.retry_count;
    }

    if (updateDto.sent_at !== undefined) {
      notification.sent_at = new Date(updateDto.sent_at);
    }

    if (updateDto.delivered_at !== undefined) {
      notification.delivered_at = new Date(updateDto.delivered_at);
    }

    if (updateDto.opened_at !== undefined) {
      notification.opened_at = new Date(updateDto.opened_at);
    }

    if (updateDto.clicked_at !== undefined) {
      notification.clicked_at = new Date(updateDto.clicked_at);
    }

    const updatedNotification =
      await this.notificationRepository.save(notification);
    return this.transformNotificationToDto(updatedNotification);
  }

  /**
   * Mark in-app notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<any> {
    const notification = await this.notificationRepository.findOne({
      where: {
        id: notificationId,
        recipient_id: userId,
        type: EntityNotificationType.IN_APP,
      },
    });

    if (!notification) {
      throw new NotFoundException('In-app notification not found');
    }

    if (!notification.opened_at) {
      notification.opened_at = new Date();
      await this.notificationRepository.save(notification);
    }

    return this.transformNotificationToDto(notification);
  }

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(userId: string): Promise<{ updated_count: number }> {
    const result = await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ opened_at: new Date() })
      .where('recipient_id = :userId', { userId })
      .andWhere('type = :type', { type: EntityNotificationType.IN_APP })
      .andWhere('opened_at IS NULL')
      .execute();

    return { updated_count: result.affected || 0 };
  }

  /**
   * Get notification delivery statistics
   */
  async getNotificationStats(userId?: string): Promise<{
    total_notifications: number;
    by_type: Record<string, number>;
    by_status: Record<string, number>;
    by_template: Record<string, number>;
    delivery_rate: number;
    open_rate: number;
    click_rate: number;
    recent_notifications: number;
    failed_notifications: number;
    avg_delivery_time: number;
  }> {
    const baseQuery =
      this.notificationRepository.createQueryBuilder('notification');

    if (userId) {
      baseQuery.where('notification.recipient_id = :userId', { userId });
    }

    // Total notifications
    const totalNotifications = await baseQuery.getCount();

    // Notifications by type
    const typeStats = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where(userId ? 'notification.recipient_id = :userId' : '1=1', { userId })
      .groupBy('notification.type')
      .getRawMany();

    const byType = typeStats.reduce(
      (acc, stat) => {
        acc[stat.type] = parseInt(stat.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Notifications by status
    const statusStats = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where(userId ? 'notification.recipient_id = :userId' : '1=1', { userId })
      .groupBy('notification.status')
      .getRawMany();

    const byStatus = statusStats.reduce(
      (acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Notifications by template
    const templateStats = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.template', 'template')
      .addSelect('COUNT(*)', 'count')
      .where(userId ? 'notification.recipient_id = :userId' : '1=1', { userId })
      .groupBy('notification.template')
      .getRawMany();

    const byTemplate = templateStats.reduce(
      (acc, stat) => {
        acc[stat.template] = parseInt(stat.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Calculate rates
    const deliveredCount = byStatus[EntityNotificationStatus.DELIVERED] || 0;
    const sentCount = byStatus[EntityNotificationStatus.SENT] || 0;
    const totalSent =
      deliveredCount +
      sentCount +
      (byStatus[EntityNotificationStatus.FAILED] || 0);
    const deliveryRate =
      totalSent > 0 ? ((deliveredCount + sentCount) / totalSent) * 100 : 0;

    // Open rate (for delivered notifications)
    const openedCount = await this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.opened_at IS NOT NULL')
      .andWhere(userId ? 'notification.recipient_id = :userId' : '1=1', {
        userId,
      })
      .getCount();

    const openRate =
      deliveredCount + sentCount > 0
        ? (openedCount / (deliveredCount + sentCount)) * 100
        : 0;

    // Click rate
    const clickedCount = await this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.clicked_at IS NOT NULL')
      .andWhere(userId ? 'notification.recipient_id = :userId' : '1=1', {
        userId,
      })
      .getCount();

    const clickRate = openedCount > 0 ? (clickedCount / openedCount) * 100 : 0;

    // Recent notifications (last 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const recentNotifications = await this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.created_at >= :date', { date: twentyFourHoursAgo })
      .andWhere(userId ? 'notification.recipient_id = :userId' : '1=1', {
        userId,
      })
      .getCount();

    // Failed notifications
    const failedNotifications = byStatus[EntityNotificationStatus.FAILED] || 0;

    // Average delivery time (simplified calculation)
    const avgDeliveryResult = await this.notificationRepository
      .createQueryBuilder('notification')
      .select(
        'AVG(EXTRACT(EPOCH FROM (notification.delivered_at - notification.created_at)))',
        'avg_time',
      )
      .where('notification.delivered_at IS NOT NULL')
      .andWhere(userId ? 'notification.recipient_id = :userId' : '1=1', {
        userId,
      })
      .getRawOne();

    const avgDeliveryTime = parseFloat(avgDeliveryResult?.avg_time) || 0;

    return {
      total_notifications: totalNotifications,
      by_type: byType,
      by_status: byStatus,
      by_template: byTemplate,
      delivery_rate: Math.round(deliveryRate * 100) / 100,
      open_rate: Math.round(openRate * 100) / 100,
      click_rate: Math.round(clickRate * 100) / 100,
      recent_notifications: recentNotifications,
      failed_notifications: failedNotifications,
      avg_delivery_time: Math.round(avgDeliveryTime * 100) / 100,
    };
  }

  /**
   * Delete notification
   */
  async deleteNotification(
    notificationId: string,
    userId?: string,
  ): Promise<void> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.id = :notificationId', { notificationId });

    if (userId) {
      queryBuilder.andWhere('notification.recipient_id = :userId', { userId });
    }

    const notification = await queryBuilder.getOne();

    if (!notification) {
      throw new NotFoundException('Notification not found or access denied');
    }

    await this.notificationRepository.remove(notification);
  }

  /**
   * Retry failed notification
   */
  async retryNotification(notificationId: string): Promise<any> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.status !== EntityNotificationStatus.FAILED) {
      throw new BadRequestException('Only failed notifications can be retried');
    }

    // Reset notification for retry
    notification.status = EntityNotificationStatus.PENDING;
    notification.retry_count = notification.retry_count + 1;
    notification.error_message = null;

    const updatedNotification =
      await this.notificationRepository.save(notification);

    // Trigger async delivery
    this.processNotificationAsync(updatedNotification.id);

    return this.transformNotificationToDto(updatedNotification);
  }

  /**
   * Private helper methods
   */
  private mapNotificationType(
    dtoType: NotificationType,
  ): EntityNotificationType {
    const mapping: Record<NotificationType, EntityNotificationType> = {
      [NotificationType.EMAIL]: EntityNotificationType.EMAIL,
      [NotificationType.PUSH]: EntityNotificationType.PUSH,
      [NotificationType.SMS]: EntityNotificationType.SMS,
      [NotificationType.IN_APP]: EntityNotificationType.IN_APP,
    };
    return mapping[dtoType];
  }

  private mapNotificationStatus(
    dtoStatus: NotificationStatus,
  ): EntityNotificationStatus {
    const mapping: Record<NotificationStatus, EntityNotificationStatus> = {
      [NotificationStatus.PENDING]: EntityNotificationStatus.PENDING,
      [NotificationStatus.SENT]: EntityNotificationStatus.SENT,
      [NotificationStatus.DELIVERED]: EntityNotificationStatus.DELIVERED,
      [NotificationStatus.FAILED]: EntityNotificationStatus.FAILED,
      [NotificationStatus.BOUNCED]: EntityNotificationStatus.BOUNCED,
    };
    return mapping[dtoStatus];
  }

  private applySearchFilters(
    queryBuilder: SelectQueryBuilder<Notification>,
    searchDto: NotificationSearchDto,
  ): void {
    const {
      type,
      status,
      template,
      created_after,
      created_before,
      is_read,
      search,
    } = searchDto;

    if (type) {
      const mappedType = this.mapNotificationType(type);
      queryBuilder.andWhere('notification.type = :type', { type: mappedType });
    }

    if (status) {
      const mappedStatus = this.mapNotificationStatus(status);
      queryBuilder.andWhere('notification.status = :status', {
        status: mappedStatus,
      });
    }

    if (template) {
      queryBuilder.andWhere('notification.template = :template', { template });
    }

    if (created_after) {
      queryBuilder.andWhere('notification.created_at >= :created_after', {
        created_after: new Date(created_after),
      });
    }

    if (created_before) {
      queryBuilder.andWhere('notification.created_at <= :created_before', {
        created_before: new Date(created_before),
      });
    }

    if (is_read !== undefined) {
      if (is_read) {
        queryBuilder.andWhere('notification.opened_at IS NOT NULL');
      } else {
        queryBuilder.andWhere('notification.opened_at IS NULL');
      }
    }

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(notification.subject) LIKE LOWER(:search) OR LOWER(notification.content) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }
  }

  private validateSortField(sortBy: string): string {
    const allowedFields = ['created_at', 'sent_at', 'delivered_at', 'subject'];
    if (!allowedFields.includes(sortBy)) {
      throw new BadRequestException(`Invalid sort field: ${sortBy}`);
    }
    return sortBy;
  }

  private transformNotificationToDto(notification: Notification): any {
    return {
      id: notification.id,
      recipient_id: notification.recipient_id,
      type: this.mapEntityNotificationTypeToDto(notification.type),
      template: notification.template,
      subject: notification.subject,
      content: notification.content,
      payload: notification.payload,
      status: this.mapEntityNotificationStatusToDto(notification.status),
      external_id: notification.external_id,
      error_message: notification.error_message,
      retry_count: notification.retry_count,
      sent_at: notification.sent_at?.toISOString() || null,
      delivered_at: notification.delivered_at?.toISOString() || null,
      opened_at: notification.opened_at?.toISOString() || null,
      clicked_at: notification.clicked_at?.toISOString() || null,
      created_at: notification.created_at.toISOString(),
      updated_at: notification.updated_at.toISOString(),
      is_read: !!notification.opened_at,
    };
  }

  private mapEntityNotificationTypeToDto(
    entityType: EntityNotificationType,
  ): NotificationType {
    const mapping: Record<EntityNotificationType, NotificationType> = {
      [EntityNotificationType.EMAIL]: NotificationType.EMAIL,
      [EntityNotificationType.PUSH]: NotificationType.PUSH,
      [EntityNotificationType.SMS]: NotificationType.SMS,
      [EntityNotificationType.IN_APP]: NotificationType.IN_APP,
    };
    return mapping[entityType];
  }

  private mapEntityNotificationStatusToDto(
    entityStatus: EntityNotificationStatus,
  ): NotificationStatus {
    const mapping: Record<EntityNotificationStatus, NotificationStatus> = {
      [EntityNotificationStatus.PENDING]: NotificationStatus.PENDING,
      [EntityNotificationStatus.SENT]: NotificationStatus.SENT,
      [EntityNotificationStatus.DELIVERED]: NotificationStatus.DELIVERED,
      [EntityNotificationStatus.FAILED]: NotificationStatus.FAILED,
      [EntityNotificationStatus.BOUNCED]: NotificationStatus.BOUNCED,
    };
    return mapping[entityStatus];
  }

  private async processNotificationAsync(
    notificationId: string,
  ): Promise<void> {
    // Mock async notification processing - in real implementation, this would:
    // 1. Integrate with email providers (SendGrid, AWS SES, etc.)
    // 2. Send push notifications (Firebase, APNs, etc.)
    // 3. Send SMS (Twilio, AWS SNS, etc.)
    // 4. Store in-app notifications

    setTimeout(async () => {
      const notification = await this.notificationRepository.findOne({
        where: { id: notificationId },
      });

      if (
        notification &&
        notification.status === EntityNotificationStatus.PENDING
      ) {
        // Simulate successful delivery
        notification.status = EntityNotificationStatus.SENT;
        notification.sent_at = new Date();

        // Simulate delivery confirmation after a short delay
        setTimeout(async () => {
          notification.status = EntityNotificationStatus.DELIVERED;
          notification.delivered_at = new Date();
          await this.notificationRepository.save(notification);
        }, 1000);

        await this.notificationRepository.save(notification);
      }
    }, 2000); // 2 seconds for demo
  }
}
