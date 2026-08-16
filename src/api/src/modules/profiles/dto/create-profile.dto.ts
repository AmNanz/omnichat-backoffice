import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { EntityStatus } from '../../../common/enums/entity-status.enum';

export class CreateProfileDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : undefined;
  })
  @IsInt()
  @Min(0)
  companyLimit?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : undefined;
  })
  @IsInt()
  @Min(0)
  userLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expirationDate?: Date;

  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value != null && value !== '')
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legalEntityNumber?: string;

  @ApiProperty({ description: 'Display name for the new frontoffice user account' })
  @IsString()
  @MinLength(2)
  accountDisplayName!: string;

  @ApiProperty({ description: 'Email for the new frontoffice user account' })
  @IsEmail()
  accountEmail!: string;

  @ApiProperty({ description: 'Password for the new frontoffice user account' })
  @IsString()
  @MinLength(6)
  accountPassword!: string;
}
