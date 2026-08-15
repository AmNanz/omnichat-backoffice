import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { UsersModule } from '../users/users.module';
import { UsageController } from './controllers/usage.controller';
import { UsageService } from './services/usage.service';

@Module({
  imports: [ProfilesModule, CompaniesModule, UsersModule],
  controllers: [UsageController],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}
