import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { NotificationChannel } from '../../../common/enums/notification-channel.enum';
import { buildPaginatedResponse } from '../../../common/types/paginated-response.types';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationsRepository } from '../repositories/notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async create(dto: CreateNotificationDto) {
    return this.notificationsRepository.create({
      userId: new Types.ObjectId(dto.userId),
      type: dto.type,
      title: dto.title,
      body: dto.body,
      channel: dto.channel ?? NotificationChannel.IN_APP,
      meta: dto.meta ?? {},
      readAt: null,
    });
  }

  async listMine(userId: string, query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await this.notificationsRepository.findMany(
      { userId: new Types.ObjectId(userId) },
      page,
      limit,
    );
    return buildPaginatedResponse(items, total, page, limit);
  }

  async markRead(id: string, userId: string) {
    const updated = await this.notificationsRepository.markRead(id, userId);
    if (!updated) {
      throw new NotFoundException('Notification not found');
    }
    return updated;
  }
}
