import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { FrontUsersRepository } from '../repositories/front-users.repository';
import { FrontUserStatus } from '../schemas/front-user.schema';

const BCRYPT_ROUNDS = 10;

export type FrontUserOption = {
  _id: string;
  email: string;
  displayName: string;
  status: string;
  profileId?: string;
};

export type CreateFrontAccountInput = {
  email: string;
  password: string;
  displayName: string;
  profileId: string;
};

export type UpdateFrontAccountInput = {
  email?: string;
  password?: string;
  displayName?: string;
  profileId?: string;
  roleIds?: string[];
};

@Injectable()
export class FrontUsersService implements OnModuleInit {
  constructor(private readonly frontUsersRepository: FrontUsersRepository) {}

  async onModuleInit(): Promise<void> {
    await this.frontUsersRepository.dropUniqueProfileIdIndex();
  }

  async list(query: PaginationQueryDto): Promise<{ items: FrontUserOption[] }> {
    const items = await this.frontUsersRepository.findOptions(
      query.search,
      200,
    );
    return {
      items: items.map((user) => this.toOption(user)),
    };
  }

  async getRequired(id: string): Promise<FrontUserOption> {
    const user = await this.frontUsersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Account (front user) not found');
    }
    return this.toOption(user);
  }

  async findByProfileId(profileId: string): Promise<FrontUserOption | null> {
    const user = await this.frontUsersRepository.findByProfileId(profileId);
    return user ? this.toOption(user) : null;
  }

  async createAccount(input: CreateFrontAccountInput): Promise<FrontUserOption> {
    const email = input.email.trim().toLowerCase();
    const existingEmail = await this.frontUsersRepository.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException(`Account email already exists: ${email}`);
    }
    const created = await this.frontUsersRepository.create({
      email,
      passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      displayName: input.displayName.trim(),
      roleIds: [],
      status: FrontUserStatus.ACTIVE,
      isSuperAdmin: false,
      profileId: input.profileId,
    });
    return this.toOption(created);
  }

  async updateAccount(
    id: string,
    input: UpdateFrontAccountInput,
  ): Promise<FrontUserOption> {
    const current = await this.getRequired(id);
    if (input.email) {
      const email = input.email.trim().toLowerCase();
      const existing = await this.frontUsersRepository.findByEmail(email);
      if (existing && String(existing._id) !== id) {
        throw new ConflictException(`Account email already exists: ${email}`);
      }
    }
    const updated = await this.frontUsersRepository.updateById(id, {
      $set: {
        ...(input.displayName !== undefined
          ? { displayName: input.displayName.trim() }
          : {}),
        ...(input.email !== undefined
          ? { email: input.email.trim().toLowerCase() }
          : {}),
        ...(input.password
          ? { passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS) }
          : {}),
        ...(input.profileId !== undefined ? { profileId: input.profileId } : {}),
        ...(input.roleIds !== undefined
          ? { roleIds: input.roleIds.map((id) => new Types.ObjectId(id)) }
          : {}),
      },
    });
    if (!updated) {
      throw new NotFoundException('Account (front user) not found');
    }
    return this.toOption(updated);
  }

  async deleteById(id: string) {
    return this.frontUsersRepository.deleteById(id);
  }

  private toOption(user: {
    _id: unknown;
    email: string;
    displayName: string;
    status: string;
    profileId?: string;
  }): FrontUserOption {
    return {
      _id: String(user._id),
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      ...(user.profileId ? { profileId: user.profileId } : {}),
    };
  }
}
