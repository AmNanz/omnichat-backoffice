import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateSubscriptionDto } from './create-subscription.dto';

export class UpdateSubscriptionDto extends PartialType(
  OmitType(CreateSubscriptionDto, ['profileId'] as const),
) {}
