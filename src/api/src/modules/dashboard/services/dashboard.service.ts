import { Injectable } from '@nestjs/common';
import { EntityStatus } from '../../../common/enums/entity-status.enum';
import { InvoiceStatus } from '../../../common/enums/invoice-status.enum';
import { CompaniesRepository } from '../../companies/repositories/companies.repository';
import { InvoicesRepository } from '../../invoices/repositories/invoices.repository';
import { ProfilesRepository } from '../../profiles/repositories/profiles.repository';
import { SubscriptionsRepository } from '../../subscriptions/repositories/subscriptions.repository';
import { UsersRepository } from '../../users/repositories/users.repository';

@Injectable()
export class DashboardService {
  constructor(
    private readonly profilesRepository: ProfilesRepository,
    private readonly companiesRepository: CompaniesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly invoicesRepository: InvoicesRepository,
  ) {}

  async getSummary() {
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalProfiles,
      totalCompanies,
      totalUsers,
      activeCompanies,
      activeUsers,
      expiredCompanies,
      expiredUsers,
      activeSubscriptions,
      pendingInvoices,
      overdueInvoices,
      revenueAgg,
      expiringCompanies,
      expiringUsers,
    ] = await Promise.all([
      this.profilesRepository.countActiveByStatus(),
      this.companiesRepository.countByStatus(),
      this.usersRepository.countByStatus(),
      this.companiesRepository.countByStatus(EntityStatus.ACTIVE),
      this.usersRepository.countByStatus(EntityStatus.ACTIVE),
      this.companiesRepository.countByStatus(EntityStatus.EXPIRED),
      this.usersRepository.countByStatus(EntityStatus.EXPIRED),
      this.subscriptionsRepository.countByStatus(EntityStatus.ACTIVE),
      this.invoicesRepository.countByStatus(InvoiceStatus.PENDING),
      this.invoicesRepository.countByStatus(InvoiceStatus.OVERDUE),
      this.invoicesRepository.sumPaidTotal(),
      this.companiesRepository.findExpiringSoon(now, soon),
      this.usersRepository.findExpiringSoon(now, soon),
    ]);

    return {
      totalProfiles,
      totalCompanies,
      totalUsers,
      activeCompanies,
      activeUsers,
      expiredCompanies,
      expiredUsers,
      expiringSoon: {
        companies: expiringCompanies.length,
        users: expiringUsers.length,
      },
      activeSubscriptions,
      pendingInvoices,
      overdueInvoices,
      revenue: revenueAgg[0]?.total ?? 0,
    };
  }
}
