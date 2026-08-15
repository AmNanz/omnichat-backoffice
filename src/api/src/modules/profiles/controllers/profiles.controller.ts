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
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ProfilesService } from '../services/profiles.service';

@ApiTags('Profiles')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('backoffice/profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @RequirePermissions('profile.create')
  @ApiOperation({ summary: 'Create profile' })
  create(@Body() dto: CreateProfileDto) {
    return this.profilesService.create(dto);
  }

  @Get()
  @RequirePermissions('profile.view')
  @ApiOperation({ summary: 'List profiles' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.profilesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('profile.view')
  @ApiOperation({ summary: 'Get profile by id' })
  findOne(@Param('id') id: string) {
    return this.profilesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('profile.update')
  @ApiOperation({ summary: 'Update profile' })
  update(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.profilesService.update(id, dto);
  }

  @Patch(':id/enable')
  @RequirePermissions('profile.update')
  @ApiOperation({ summary: 'Enable profile' })
  enable(@Param('id') id: string) {
    return this.profilesService.enable(id);
  }

  @Patch(':id/disable')
  @RequirePermissions('profile.update')
  @ApiOperation({ summary: 'Disable profile' })
  disable(@Param('id') id: string) {
    return this.profilesService.disable(id);
  }

  @Delete(':id')
  @RequirePermissions('profile.delete')
  @ApiOperation({ summary: 'Soft delete profile' })
  remove(@Param('id') id: string) {
    return this.profilesService.remove(id);
  }
}
