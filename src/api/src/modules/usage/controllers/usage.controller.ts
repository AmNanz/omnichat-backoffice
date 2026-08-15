import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { UsageService } from '../services/usage.service';

@ApiTags('Usage')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('backoffice/usage')
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get()
  @RequirePermissions('usage.view')
  @ApiOperation({ summary: 'Usage overview' })
  getOverview() {
    return this.usageService.getOverview();
  }

  @Get('profile/:profileId')
  @RequirePermissions('usage.view')
  @ApiOperation({ summary: 'Usage for a profile (counts vs limits)' })
  getByProfile(@Param('profileId') profileId: string) {
    return this.usageService.getByProfile(profileId);
  }
}
