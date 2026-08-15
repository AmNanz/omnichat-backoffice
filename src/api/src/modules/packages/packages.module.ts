import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PackagesController } from './controllers/packages.controller';
import { PackagesRepository } from './repositories/packages.repository';
import { PackageEntity, PackageSchema } from './schemas/package.schema';
import { PackagesService } from './services/packages.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PackageEntity.name, schema: PackageSchema },
    ]),
  ],
  controllers: [PackagesController],
  providers: [PackagesService, PackagesRepository],
  exports: [PackagesService, PackagesRepository],
})
export class PackagesModule {}
