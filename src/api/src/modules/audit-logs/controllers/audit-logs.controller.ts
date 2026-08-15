import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { AuditAction } from '../../../common/enums/audit-action.enum';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { AuditLogsService } from '../services/audit-logs.service';

class AuditLogListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional({ enum: AuditAction })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  userId?: string;
}

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('backoffice/audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @RequirePermissions('audit_log.view')
  @ApiOperation({ summary: 'List audit logs' })
  findAll(@Query() query: AuditLogListQueryDto) {
    return this.auditLogsService.findAll(query);
  }
}
