import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CLEANUP_QUEUE } from './processors/cleanup.processor';
import { EXPIRATION_CHECK_QUEUE } from './processors/expiration-check.processor';
import { INVOICE_REMINDER_QUEUE } from './processors/invoice-reminder.processor';
import { NOTIFICATION_QUEUE } from './processors/notification.processor';
import { USAGE_CHECK_QUEUE } from './processors/usage-check.processor';

@Injectable()
export class JobsScheduler implements OnModuleInit {
  private readonly logger = new Logger(JobsScheduler.name);

  constructor(
    @InjectQueue(EXPIRATION_CHECK_QUEUE)
    private readonly expirationQueue: Queue,
    @InjectQueue(INVOICE_REMINDER_QUEUE)
    private readonly invoiceReminderQueue: Queue,
    @InjectQueue(USAGE_CHECK_QUEUE) private readonly usageQueue: Queue,
    @InjectQueue(NOTIFICATION_QUEUE)
    private readonly notificationQueue: Queue,
    @InjectQueue(CLEANUP_QUEUE) private readonly cleanupQueue: Queue,
  ) {}

  async onModuleInit() {
    try {
      await this.upsertRepeatable(
        this.expirationQueue,
        'expiration-check-daily',
        '0 2 * * *',
      );
      await this.upsertRepeatable(
        this.invoiceReminderQueue,
        'invoice-reminder-daily',
        '0 3 * * *',
      );
      await this.upsertRepeatable(
        this.usageQueue,
        'usage-check-daily',
        '0 4 * * *',
      );
      await this.upsertRepeatable(
        this.cleanupQueue,
        'cleanup-weekly',
        '0 5 * * 0',
      );
      // Keep notification queue registered; jobs are enqueued on demand
      void this.notificationQueue;
      this.logger.log('Repeatable BullMQ jobs scheduled');
    } catch (error) {
      this.logger.warn(
        `BullMQ scheduler skipped (Redis unavailable): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async upsertRepeatable(
    queue: Queue,
    jobName: string,
    pattern: string,
  ) {
    const existing = await queue.getRepeatableJobs();
    for (const job of existing) {
      if (job.name === jobName) {
        await queue.removeRepeatableByKey(job.key);
      }
    }
    await queue.add(
      jobName,
      {},
      {
        repeat: { pattern },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );
  }
}
