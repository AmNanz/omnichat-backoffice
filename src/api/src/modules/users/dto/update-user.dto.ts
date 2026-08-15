import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {}

export class ResetPasswordDto {
  @ApiPropertyOptional({ description: 'New password (min 6 chars)' })
  @IsString()
  @MinLength(6)
  password!: string;
}
