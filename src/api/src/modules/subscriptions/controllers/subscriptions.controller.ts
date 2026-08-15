import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';
import { UpdateSubscriptionDto } from '../dto/update-subscription.dto';
import { SubscriptionsService } from '../services/subscriptions.service';

class SubscriptionListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  profileId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  companyId?: string;
}

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('backoffice/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @RequirePermissions('subscription.create')
  @ApiOperation({ summary: 'Create subscription / assign package' })
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(dto);
  }

  @Get()
  @RequirePermissions('subscription.view')
  @ApiOperation({ summary: 'List subscriptions' })
  findAll(@Query() query: SubscriptionListQueryDto) {
    return this.subscriptionsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('subscription.view')
  @ApiOperation({ summary: 'Get subscription by id' })
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('subscription.update')
  @ApiOperation({ summary: 'Update subscription' })
  update(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(id, dto);
  }

  @Patch(':id/enable')
  @RequirePermissions('subscription.update')
  @ApiOperation({ summary: 'Enable subscription' })
  enable(@Param('id') id: string) {
    return this.subscriptionsService.enable(id);
  }

  @Patch(':id/disable')
  @RequirePermissions('subscription.update')
  @ApiOperation({ summary: 'Disable subscription' })
  disable(@Param('id') id: string) {
    return this.subscriptionsService.disable(id);
  }

  @Delete(':id')
  @RequirePermissions('subscription.delete')
  @ApiOperation({ summary: 'Delete subscription' })
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }
}
