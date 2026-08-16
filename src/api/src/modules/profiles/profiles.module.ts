import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FrontCompaniesModule } from '../front-companies/front-companies.module';
import { FrontUsersModule } from '../front-users/front-users.module';
import { CompaniesModule } from '../companies/companies.module';
import { ProfilesController } from './controllers/profiles.controller';
import { ProfilesRepository } from './repositories/profiles.repository';
import { Profile, ProfileSchema } from './schemas/profile.schema';
import { ProfilesService } from './services/profiles.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
    FrontUsersModule,
    FrontCompaniesModule,
    forwardRef(() => CompaniesModule),
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService, ProfilesRepository],
  exports: [ProfilesService, ProfilesRepository],
})
export class ProfilesModule {}
