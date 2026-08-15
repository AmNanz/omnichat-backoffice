import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { NotificationChannel } from '../../../common/enums/notification-channel.enum';

export class CreateNotificationDto {
  @ApiProperty()
  @IsMongoId()
  userId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  type!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  body!: string;

  @ApiPropertyOptional({ enum: NotificationChannel })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}
