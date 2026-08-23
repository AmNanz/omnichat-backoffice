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
import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { CompaniesService } from '../services/companies.service';

class CompanyListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  profileId?: string;

  @ApiPropertyOptional({
    description: 'Active companies with expirationDate within N days from now',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  expiringWithinDays?: number;
}

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('backoffice/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @RequirePermissions('company.create')
  @ApiOperation({ summary: 'Create company' })
  create(@Body() dto: CreateCompanyDto) {
    return this.companiesService.create(dto);
  }

  @Get()
  @RequirePermissions('company.view')
  @ApiOperation({ summary: 'List companies' })
  findAll(@Query() query: CompanyListQueryDto) {
    return this.companiesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('company.view')
  @ApiOperation({ summary: 'Get company by id' })
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('company.update')
  @ApiOperation({ summary: 'Update company' })
  update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.update(id, dto);
  }

  @Patch(':id/enable')
  @RequirePermissions('company.update')
  @ApiOperation({ summary: 'Enable company' })
  enable(@Param('id') id: string) {
    return this.companiesService.enable(id);
  }

  @Patch(':id/disable')
  @RequirePermissions('company.update')
  @ApiOperation({ summary: 'Disable company' })
  disable(@Param('id') id: string) {
    return this.companiesService.disable(id);
  }

  @Delete(':id')
  @RequirePermissions('company.delete')
  @ApiOperation({ summary: 'Soft delete company' })
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}
