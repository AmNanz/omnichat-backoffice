import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CompaniesRepository } from '../../companies/repositories/companies.repository';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { ProfilesRepository } from '../../profiles/repositories/profiles.repository';
import { SubscriptionsRepository } from '../../subscriptions/repositories/subscriptions.repository';
import { UsersRepository } from '../../users/repositories/users.repository';

export const EXPIRATION_CHECK_QUEUE = 'expiration-check';

@Processor(EXPIRATION_CHECK_QUEUE)
export class ExpirationCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(ExpirationCheckProcessor.name);

  constructor(
    private readonly profilesRepository: ProfilesRepository,
    private readonly companiesRepository: CompaniesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(_job: Job): Promise<{ expired: number }> {
    const now = new Date();
    const [profiles, companies, users, subscriptions] = await Promise.all([
      this.profilesRepository.findExpiredCandidates(now),
      this.companiesRepository.findExpiredCandidates(now),
      this.usersRepository.findExpiredCandidates(now),
      this.subscriptionsRepository.findExpiredCandidates(now),
    ]);

    await Promise.all([
      this.profilesRepository.markExpired(profiles.map((p) => String(p._id))),
      this.companiesRepository.markExpired(companies.map((c) => String(c._id))),
      this.usersRepository.markExpired(users.map((u) => String(u._id))),
      this.subscriptionsRepository.markExpired(
        subscriptions.map((s) => String(s._id)),
      ),
    ]);

    const staffUsers = await this.usersRepository.findMany(
      { isStaff: true },
      1,
      20,
    );
    const notifyTargets = staffUsers[0] ?? [];
    for (const user of notifyTargets) {
      const total =
        profiles.length +
        companies.length +
        users.length +
        subscriptions.length;
      if (total > 0) {
        await this.notificationsService.create({
          userId: String(user._id),
          type: 'expiration',
          title: 'Entities expired',
          body: `${total} entity(ies) marked as EXPIRED`,
          meta: {
            profiles: profiles.length,
            companies: companies.length,
            users: users.length,
            subscriptions: subscriptions.length,
          },
        });
      }
    }

    this.logger.log(
      `Expiration check done: profiles=${profiles.length} companies=${companies.length} users=${users.length} subscriptions=${subscriptions.length}`,
    );
    return {
      expired:
        profiles.length +
        companies.length +
        users.length +
        subscriptions.length,
    };
  }
}
