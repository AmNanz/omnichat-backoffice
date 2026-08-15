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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CreatePackageDto } from '../dto/create-package.dto';
import { UpdatePackageDto } from '../dto/update-package.dto';
import { PackagesService } from '../services/packages.service';

@ApiTags('Packages')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('backoffice/packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  @RequirePermissions('package.create')
  @ApiOperation({ summary: 'Create package' })
  create(@Body() dto: CreatePackageDto) {
    return this.packagesService.create(dto);
  }

  @Get()
  @RequirePermissions('package.view')
  @ApiOperation({ summary: 'List packages' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.packagesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('package.view')
  @ApiOperation({ summary: 'Get package by id' })
  findOne(@Param('id') id: string) {
    return this.packagesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('package.update')
  @ApiOperation({ summary: 'Update package' })
  update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packagesService.update(id, dto);
  }

  @Patch(':id/enable')
  @RequirePermissions('package.update')
  @ApiOperation({ summary: 'Enable package' })
  enable(@Param('id') id: string) {
    return this.packagesService.enable(id);
  }

  @Patch(':id/disable')
  @RequirePermissions('package.update')
  @ApiOperation({ summary: 'Disable package' })
  disable(@Param('id') id: string) {
    return this.packagesService.disable(id);
  }

  @Delete(':id')
  @RequirePermissions('package.delete')
  @ApiOperation({ summary: 'Delete package' })
  remove(@Param('id') id: string) {
    return this.packagesService.remove(id);
  }
}
