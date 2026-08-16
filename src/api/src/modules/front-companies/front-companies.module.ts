import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FRONTOFFICE_CONNECTION } from '../../config/database.constants';
import { FrontCompaniesRepository } from './repositories/front-companies.repository';
import {
  FrontCompanyMember,
  FrontCompanyMemberSchema,
} from './schemas/front-company-member.schema';
import {
  FrontCompany,
  FrontCompanySchema,
} from './schemas/front-company.schema';
import { FrontRole, FrontRoleSchema } from './schemas/front-role.schema';
import { FrontCompaniesService } from './services/front-companies.service';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: FrontCompany.name, schema: FrontCompanySchema },
        { name: FrontRole.name, schema: FrontRoleSchema },
        { name: FrontCompanyMember.name, schema: FrontCompanyMemberSchema },
      ],
      FRONTOFFICE_CONNECTION,
    ),
  ],
  providers: [FrontCompaniesService, FrontCompaniesRepository],
  exports: [FrontCompaniesService],
})
export class FrontCompaniesModule {}
