import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FRONTOFFICE_CONNECTION } from '../../config/database.constants';
import { FrontUsersController } from './controllers/front-users.controller';
import { FrontUsersRepository } from './repositories/front-users.repository';
import { FrontUser, FrontUserSchema } from './schemas/front-user.schema';
import { FrontUsersService } from './services/front-users.service';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: FrontUser.name, schema: FrontUserSchema }],
      FRONTOFFICE_CONNECTION,
    ),
  ],
  controllers: [FrontUsersController],
  providers: [FrontUsersService, FrontUsersRepository],
  exports: [FrontUsersService],
})
export class FrontUsersModule {}
