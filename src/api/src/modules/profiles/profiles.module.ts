import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PackagesModule } from '../packages/packages.module';
import { ProfilesController } from './controllers/profiles.controller';
import { ProfilesRepository } from './repositories/profiles.repository';
import { Profile, ProfileSchema } from './schemas/profile.schema';
import { ProfilesService } from './services/profiles.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
    PackagesModule,
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService, ProfilesRepository],
  exports: [ProfilesService, ProfilesRepository],
})
export class ProfilesModule {}
