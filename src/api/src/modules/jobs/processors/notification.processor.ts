import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { CreateNotificationDto } from '../../notifications/dto/create-notification.dto';

export const NOTIFICATION_QUEUE = 'notification';

@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<CreateNotificationDto>): Promise<{ ok: boolean }> {
    await this.notificationsService.create(job.data);
    this.logger.log(`Notification created for user ${job.data.userId}`);
    return { ok: true };
  }
}
