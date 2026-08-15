import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CompaniesRepository } from '../../companies/repositories/companies.repository';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { ProfilesRepository } from '../../profiles/repositories/profiles.repository';
import { UsersRepository } from '../../users/repositories/users.repository';

export const USAGE_CHECK_QUEUE = 'usage-check';

@Processor(USAGE_CHECK_QUEUE)
export class UsageCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(UsageCheckProcessor.name);

  constructor(
    private readonly profilesRepository: ProfilesRepository,
    private readonly companiesRepository: CompaniesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(_job: Job): Promise<{ nearLimit: number }> {
    const [profiles] = await this.profilesRepository.findMany({}, 1, 500);
    const [staff] = await this.usersRepository.findMany({ isStaff: true }, 1, 20);
    let nearLimit = 0;

    for (const profile of profiles) {
      const companyCount = await this.companiesRepository.countByProfile(
        String(profile._id),
      );
      const userCount = await this.usersRepository.countByProfile(
        String(profile._id),
      );
      const companyNear =
        profile.companyLimit > 0 &&
        companyCount >= Math.ceil(profile.companyLimit * 0.8);
      const userNear =
        profile.userLimit > 0 &&
        userCount >= Math.ceil(profile.userLimit * 0.8);
      if (!companyNear && !userNear) {
        continue;
      }
      nearLimit += 1;
      for (const user of staff) {
        await this.notificationsService.create({
          userId: String(user._id),
          type: 'usage_near_limit',
          title: `Usage near limit: ${profile.name}`,
          body: `Companies ${companyCount}/${profile.companyLimit}, Users ${userCount}/${profile.userLimit}`,
          meta: { profileId: String(profile._id) },
        });
      }
    }

    this.logger.log(`Usage check done: nearLimit=${nearLimit}`);
    return { nearLimit };
  }
}
