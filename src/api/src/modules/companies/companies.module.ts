import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OmnichatIntegrationModule } from '../omnichat-integration/omnichat-integration.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { CompaniesController } from './controllers/companies.controller';
import { CompaniesRepository } from './repositories/companies.repository';
import { Company, CompanySchema } from './schemas/company.schema';
import { CompaniesService } from './services/companies.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
    ProfilesModule,
    forwardRef(() => OmnichatIntegrationModule),
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService, CompaniesRepository],
  exports: [CompaniesService, CompaniesRepository],
})
export class CompaniesModule {}
