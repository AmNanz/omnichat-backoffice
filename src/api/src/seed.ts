import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { ALL_PERMISSIONS } from './common/constants/permissions';
import { BillingCycle } from './common/enums/billing-cycle.enum';
import { EntityStatus } from './common/enums/entity-status.enum';
import {
  maskMongoUri,
  resolveAppEnv,
  resolveEnvFilePaths,
} from './config/env.config';
import {
  PackageEntity,
  PackageSchema,
} from './modules/packages/schemas/package.schema';
import { Role, RoleSchema } from './modules/roles/schemas/role.schema';
import { User, UserSchema } from './modules/users/schemas/user.schema';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveEnvFilePaths(),
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('SeedDatabase');
        const mongoUri =
          configService.get<string>('MONGO_URI_BACKOFFICE') ??
          'mongodb://localhost:27017/omnichat-backoffice-local';
        logger.log(`APP_ENV=${resolveAppEnv()}`);
        logger.log(`MONGO_URI_BACKOFFICE=${maskMongoUri(mongoUri)}`);
        return { uri: mongoUri };
      },
    }),
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema },
      { name: User.name, schema: UserSchema },
      { name: PackageEntity.name, schema: PackageSchema },
    ]),
  ],
})
class SeedModule {}

async function seed() {
  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['log', 'error', 'warn'],
  });

  const roleModel = app.get<Model<Role>>(getModelToken(Role.name));
  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const packageModel = app.get<Model<PackageEntity>>(
    getModelToken(PackageEntity.name),
  );

  let adminRole = await roleModel.findOne({ slug: 'admin' }).exec();
  if (!adminRole) {
    adminRole = await roleModel.create({
      name: 'Admin',
      slug: 'admin',
      permissions: ALL_PERMISSIONS,
      status: EntityStatus.ACTIVE,
      description: 'Full access backoffice administrator',
    });
    Logger.log(`Created Admin role ${String(adminRole._id)}`, 'Seed');
  } else {
    adminRole.permissions = ALL_PERMISSIONS;
    await adminRole.save();
    Logger.log('Updated Admin role permissions', 'Seed');
  }

  const email = 'admin@backoffice.local';
  const passwordHash = await bcrypt.hash('admin123', 10);
  const existingAdmin = await userModel.findOne({ email }).exec();
  if (!existingAdmin) {
    await userModel.create({
      email,
      passwordHash,
      displayName: 'Backoffice Admin',
      roleIds: [adminRole._id],
      companyIds: [],
      status: EntityStatus.ACTIVE,
      startDate: new Date(),
      isStaff: true,
    });
    Logger.log(`Created admin user ${email}`, 'Seed');
  } else {
    await userModel
      .updateOne(
        { _id: existingAdmin._id },
        {
          $set: {
            passwordHash,
            roleIds: [adminRole._id],
            isStaff: true,
            status: EntityStatus.ACTIVE,
          },
        },
      )
      .exec();
    Logger.log(`Updated admin user ${email}`, 'Seed');
  }

  const sampleSlug = 'starter';
  let samplePackage = await packageModel.findOne({ slug: sampleSlug }).exec();
  if (!samplePackage) {
    samplePackage = await packageModel.create({
      name: 'Starter',
      slug: sampleSlug,
      description: 'Sample starter package',
      price: 990,
      billingCycle: BillingCycle.MONTHLY,
      companyLimit: 5,
      userLimit: 20,
      features: ['chat', 'reports'],
      status: EntityStatus.ACTIVE,
    });
    Logger.log(`Created sample package ${samplePackage.name}`, 'Seed');
  } else {
    Logger.log('Sample package already exists', 'Seed');
  }

  await app.close();
  Logger.log('Seed completed', 'Seed');
}

void seed().catch((error: unknown) => {
  Logger.error(
    error instanceof Error ? error.message : String(error),
    error instanceof Error ? error.stack : undefined,
    'Seed',
  );
  process.exit(1);
});
