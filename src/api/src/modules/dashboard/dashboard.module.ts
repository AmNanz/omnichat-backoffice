import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { UsersModule } from '../users/users.module';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';

@Module({
  imports: [
    ProfilesModule,
    CompaniesModule,
    UsersModule,
    SubscriptionsModule,
    InvoicesModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
