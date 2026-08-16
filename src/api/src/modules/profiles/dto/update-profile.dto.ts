import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { CreateProfileDto } from './create-profile.dto';

export class UpdateProfileDto extends PartialType(
  OmitType(CreateProfileDto, ['accountPassword'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value != null && value !== '')
  @IsString()
  @MinLength(6)
  accountPassword?: string;
}
