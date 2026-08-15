import { Injectable, NotFoundException } from '@nestjs/common';
import { CompaniesRepository } from '../../companies/repositories/companies.repository';
import { ProfilesRepository } from '../../profiles/repositories/profiles.repository';
import { UsersRepository } from '../../users/repositories/users.repository';

@Injectable()
export class UsageService {
  constructor(
    private readonly profilesRepository: ProfilesRepository,
    private readonly companiesRepository: CompaniesRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async getOverview() {
    const profiles = await this.profilesRepository.countActiveByStatus();
    const companies = await this.companiesRepository.countByStatus();
    const users = await this.usersRepository.countByStatus();
    return {
      profiles,
      companies,
      users,
    };
  }

  async getByProfile(profileId: string) {
    const profile = await this.profilesRepository.findById(profileId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    const companyCount =
      await this.companiesRepository.countByProfile(profileId);
    const userCount = await this.usersRepository.countByProfile(profileId);
    return {
      profileId,
      profileName: profile.name,
      companies: {
        used: companyCount,
        limit: profile.companyLimit,
        remaining: Math.max(profile.companyLimit - companyCount, 0),
        nearLimit: companyCount >= Math.ceil(profile.companyLimit * 0.8),
      },
      users: {
        used: userCount,
        limit: profile.userLimit,
        remaining: Math.max(profile.userLimit - userCount, 0),
        nearLimit: userCount >= Math.ceil(profile.userLimit * 0.8),
      },
    };
  }
}
