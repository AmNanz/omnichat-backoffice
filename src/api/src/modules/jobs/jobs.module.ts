import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CompaniesModule } from '../companies/companies.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { UsersModule } from '../users/users.module';
import { JobsScheduler } from './jobs.scheduler';
import {
  CLEANUP_QUEUE,
  CleanupProcessor,
} from './processors/cleanup.processor';
import {
  EXPIRATION_CHECK_QUEUE,
  ExpirationCheckProcessor,
} from './processors/expiration-check.processor';
import {
  INVOICE_REMINDER_QUEUE,
  InvoiceReminderProcessor,
} from './processors/invoice-reminder.processor';
import {
  NOTIFICATION_QUEUE,
  NotificationProcessor,
} from './processors/notification.processor';
import {
  USAGE_CHECK_QUEUE,
  UsageCheckProcessor,
} from './processors/usage-check.processor';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') ?? '127.0.0.1',
          port: Number(configService.get<string>('REDIS_PORT') ?? 6379),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
          maxRetriesPerRequest: null,
          enableOfflineQueue: true,
          lazyConnect: true,
        },
        prefix:
          configService.get<string>('REDIS_PREFIX') ?? 'omnichat-backoffice',
      }),
    }),
    BullModule.registerQueue(
      { name: EXPIRATION_CHECK_QUEUE },
      { name: INVOICE_REMINDER_QUEUE },
      { name: USAGE_CHECK_QUEUE },
      { name: NOTIFICATION_QUEUE },
      { name: CLEANUP_QUEUE },
    ),
    ProfilesModule,
    CompaniesModule,
    UsersModule,
    SubscriptionsModule,
    InvoicesModule,
    NotificationsModule,
    AuditLogsModule,
  ],
  providers: [
    JobsScheduler,
    ExpirationCheckProcessor,
    InvoiceReminderProcessor,
    UsageCheckProcessor,
    NotificationProcessor,
    CleanupProcessor,
  ],
  exports: [BullModule],
})
export class JobsModule {}
