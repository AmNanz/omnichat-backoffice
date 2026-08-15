import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PermissionsService } from '../services/permissions.service';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('backoffice/permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions('permission.view')
  @ApiOperation({ summary: 'Get permission catalog' })
  getCatalog() {
    return this.permissionsService.getCatalog();
  }
}
