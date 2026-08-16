import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RequireAnyPermission } from '../../../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { FrontUsersService } from '../services/front-users.service';

@ApiTags('Front users')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('backoffice/front-users')
export class FrontUsersController {
  constructor(private readonly frontUsersService: FrontUsersService) {}

  @Get()
  @RequireAnyPermission('profile.view', 'profile.create', 'profile.update')
  @ApiOperation({ summary: 'List OmniChat/frontoffice users for Account picker' })
  list(@Query() query: PaginationQueryDto) {
    return this.frontUsersService.list(query);
  }
}
