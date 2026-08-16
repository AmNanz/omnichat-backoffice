import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { FRONTOFFICE_CONNECTION } from './config/database.constants';
import {
  maskMongoUri,
  resolveAppEnv,
  resolveEnvFilePaths,
} from './config/env.config';
import { winstonConfig } from './config/winston.config';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { FrontCompaniesModule } from './modules/front-companies/front-companies.module';
import { FrontUsersModule } from './modules/front-users/front-users.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OmnichatIntegrationModule } from './modules/omnichat-integration/omnichat-integration.module';
import { PackagesModule } from './modules/packages/packages.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { RolesModule } from './modules/roles/roles.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { UsageModule } from './modules/usage/usage.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveEnvFilePaths(),
    }),
    WinstonModule.forRoot(winstonConfig),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: Number(configService.get<string>('THROTTLE_TTL_MS') ?? 60000),
          limit: Number(configService.get<string>('THROTTLE_LIMIT') ?? 100),
        },
      ],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseConfig');
        const appEnv = resolveAppEnv();
        const mongoUri =
          configService.get<string>('MONGO_URI_BACKOFFICE') ??
          'mongodb://localhost:27017/omnichat-backoffice-local';

        logger.log(`APP_ENV=${appEnv}`);
        logger.log(`NODE_ENV=${process.env.NODE_ENV ?? '(not set)'}`);
        logger.log(`Env files=${resolveEnvFilePaths().join(', ')}`);
        logger.log(`MONGO_URI_BACKOFFICE=${maskMongoUri(mongoUri)}`);

        return { uri: mongoUri };
      },
    }),
    MongooseModule.forRootAsync({
      connectionName: FRONTOFFICE_CONNECTION,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseConfig');
        const mongoUri =
          configService.get<string>('MONGO_URI_FRONTOFFICE') ??
          'mongodb://localhost:27017/omnichat-local';

        logger.log(`MONGO_URI_FRONTOFFICE=${maskMongoUri(mongoUri)}`);

        return { uri: mongoUri };
      },
    }),
    JobsModule,
    HealthModule,
    AuthModule,
    ProfilesModule,
    FrontUsersModule,
    FrontCompaniesModule,
    CompaniesModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    PackagesModule,
    SubscriptionsModule,
    UsageModule,
    InvoicesModule,
    NotificationsModule,
    AuditLogsModule,
    DashboardModule,
    OmnichatIntegrationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
