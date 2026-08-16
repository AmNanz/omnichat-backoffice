import { ConflictException, Injectable } from '@nestjs/common';
import { FrontCompaniesRepository } from '../repositories/front-companies.repository';

export type FrontCompanyResult = {
  _id: string;
  name: string;
  slug: string;
  profileId?: string;
  adminRoleId?: string;
};

@Injectable()
export class FrontCompaniesService {
  constructor(
    private readonly frontCompaniesRepository: FrontCompaniesRepository,
  ) {}

  async createForProfile(input: {
    name: string;
    slug: string;
    profileId: string;
    userId: string;
  }): Promise<FrontCompanyResult> {
    const slug = input.slug.toLowerCase();
    const existingSlug = await this.frontCompaniesRepository.findBySlug(slug);
    if (existingSlug) {
      throw new ConflictException(`Company slug already exists: ${slug}`);
    }

    const company = await this.frontCompaniesRepository.create({
      name: input.name.trim(),
      slug,
      package: 'standard',
      chatTopicSettings: {
        selectionMode: 'SINGLE',
        selectionRequired: false,
      },
      profileId: input.profileId,
    });
    const companyId = String(company._id);
    try {
      const adminRole =
        await this.frontCompaniesRepository.ensureAdministratorRole(
          input.profileId,
          companyId,
        );
      await this.frontCompaniesRepository.addMember(
        companyId,
        input.userId,
        String(adminRole._id),
      );
      return {
        _id: companyId,
        name: company.name,
        slug: company.slug,
        profileId: company.profileId,
        adminRoleId: String(adminRole._id),
      };
    } catch (error) {
      await this.frontCompaniesRepository.deleteById(companyId);
      throw error;
    }
  }

  async findByProfileId(profileId: string): Promise<FrontCompanyResult | null> {
    const company =
      await this.frontCompaniesRepository.findByProfileId(profileId);
    if (!company) {
      return null;
    }
    return {
      _id: String(company._id),
      name: company.name,
      slug: company.slug,
      profileId: company.profileId,
    };
  }

  async deleteById(id: string) {
    return this.frontCompaniesRepository.deleteById(id);
  }
}
