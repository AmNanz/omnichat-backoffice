import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompaniesModule } from '../companies/companies.module';
import { PackagesModule } from '../packages/packages.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { SubscriptionsController } from './controllers/subscriptions.controller';
import { SubscriptionsRepository } from './repositories/subscriptions.repository';
import {
  Subscription,
  SubscriptionSchema,
} from './schemas/subscription.schema';
import { SubscriptionsService } from './services/subscriptions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    ProfilesModule,
    PackagesModule,
    CompaniesModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionsRepository],
  exports: [SubscriptionsService, SubscriptionsRepository],
})
export class SubscriptionsModule {}
