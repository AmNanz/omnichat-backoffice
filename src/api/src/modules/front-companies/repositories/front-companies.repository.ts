import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FRONTOFFICE_CONNECTION } from '../../../config/database.constants';
import {
  FrontCompanyMember,
  FrontCompanyMemberDocument,
} from '../schemas/front-company-member.schema';
import {
  FrontCompany,
  FrontCompanyDocument,
} from '../schemas/front-company.schema';
import { FrontRole, FrontRoleDocument } from '../schemas/front-role.schema';

/** Mirrors Omnichat PERMISSIONS — keep in sync when adding menus. */
const FRONT_ADMINISTRATOR_PERMISSIONS = [
  'dashboard.view',
  'channels.view',
  'channels.create',
  'channels.update',
  'channels.deactivate',
  'channels.connect',
  'files.view',
  'files.create',
  'files.update',
  'files.delete',
  'files.upload',
  'templates.view',
  'templates.create',
  'templates.update',
  'templates.delete',
  'templates.duplicate',
  'contact_groups.view',
  'contact_groups.create',
  'contact_groups.update',
  'contact_groups.delete',
  'contact_groups.add_members',
  'labels.view',
  'labels.create',
  'labels.update',
  'labels.delete',
  'tags.view',
  'tags.create',
  'tags.update',
  'tags.delete',
  'tags.deactivate',
  'chat_topics.view',
  'chat_topics.create',
  'chat_topics.update',
  'chat_topics.delete',
  'chat_groups.view',
  'chat_groups.create',
  'chat_groups.update',
  'chat_groups.delete',
  'users.view',
  'users.create',
  'users.update',
  'users.deactivate',
  'roles.view',
  'roles.create',
  'roles.update',
  'roles.deactivate',
  'companies.view',
  'companies.create',
  'companies.update',
  'companies.manage_members',
  'companies.manage_roles',
];

@Injectable()
export class FrontCompaniesRepository {
  constructor(
    @InjectModel(FrontCompany.name, FRONTOFFICE_CONNECTION)
    private readonly companyModel: Model<FrontCompanyDocument>,
    @InjectModel(FrontRole.name, FRONTOFFICE_CONNECTION)
    private readonly roleModel: Model<FrontRoleDocument>,
    @InjectModel(FrontCompanyMember.name, FRONTOFFICE_CONNECTION)
    private readonly memberModel: Model<FrontCompanyMemberDocument>,
  ) {}

  findBySlug(slug: string) {
    return this.companyModel.findOne({ slug }).exec();
  }

  findByProfileId(profileId: string) {
    return this.companyModel.findOne({ profileId }).exec();
  }

  findById(id: string) {
    return this.companyModel.findById(id).exec();
  }

  create(data: Partial<FrontCompany>) {
    return this.companyModel.create(data);
  }

  findAdminRoleByProfileId(profileId: string) {
    return this.roleModel
      .findOne({ profileId, slug: { $in: ['administrator', 'admin'] } })
      .exec();
  }

  async ensureAdministratorRole(profileId: string, companyId: string) {
    const existing = await this.findAdminRoleByProfileId(profileId);
    if (existing) {
      existing.companyId = new Types.ObjectId(companyId);
      existing.name = 'Admin';
      existing.slug = 'administrator';
      existing.description = 'Full system access';
      existing.permissions = [...FRONT_ADMINISTRATOR_PERMISSIONS];
      existing.kind = 'system';
      existing.status = 'ACTIVE';
      return existing.save();
    }
    return this.roleModel.create({
      profileId,
      companyId: new Types.ObjectId(companyId),
      name: 'Admin',
      slug: 'administrator',
      description: 'Full system access',
      permissions: [...FRONT_ADMINISTRATOR_PERMISSIONS],
      kind: 'system',
      status: 'ACTIVE',
    });
  }

  addMember(companyId: string, userId: string, roleId: string) {
    return this.memberModel.create({
      companyId: new Types.ObjectId(companyId),
      userId: new Types.ObjectId(userId),
      roleIds: [new Types.ObjectId(roleId)],
      presence: 'OFFLINE',
    });
  }

  async deleteById(id: string) {
    const company = await this.companyModel.findById(id).exec();
    await this.memberModel.deleteMany({ companyId: new Types.ObjectId(id) });
    await this.roleModel.deleteMany({
      $or: [
        { companyId: new Types.ObjectId(id) },
        ...(company?.profileId ? [{ profileId: company.profileId }] : []),
      ],
    });
    return this.companyModel.findByIdAndDelete(id).exec();
  }
}
