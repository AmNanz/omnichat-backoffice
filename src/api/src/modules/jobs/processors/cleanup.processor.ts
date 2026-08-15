import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AuditLogsRepository } from '../../audit-logs/repositories/audit-logs.repository';
import { NotificationsRepository } from '../../notifications/repositories/notifications.repository';

export const CLEANUP_QUEUE = 'cleanup';

@Processor(CLEANUP_QUEUE)
export class CleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
  ) {
    super();
  }

  async process(_job: Job): Promise<{ notifications: number; audits: number }> {
    const notifCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const auditCutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const [notifications, audits] = await Promise.all([
      this.notificationsRepository.deleteOlderThan(notifCutoff),
      this.auditLogsRepository.deleteOlderThan(auditCutoff),
    ]);
    this.logger.log(
      `Cleanup done: notifications=${notifications.deletedCount} audits=${audits.deletedCount}`,
    );
    return {
      notifications: notifications.deletedCount ?? 0,
      audits: audits.deletedCount ?? 0,
    };
  }
}
