import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import {
  AuthUser,
  CurrentUser,
} from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationsService } from '../services/notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('backoffice/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('mine')
  @RequirePermissions('notification.view')
  @ApiOperation({ summary: 'List my notifications' })
  listMine(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.notificationsService.listMine(user._id, query);
  }

  @Patch(':id/read')
  @RequirePermissions('notification.update')
  @ApiOperation({ summary: 'Mark notification as read' })
  markRead(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.notificationsService.markRead(id, user._id);
  }

  @Post()
  @RequirePermissions('notification.create')
  @ApiOperation({ summary: 'Create notification (internal)' })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }
}
