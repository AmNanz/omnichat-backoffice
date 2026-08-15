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
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import {
  AuthUser,
  CurrentUser,
} from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { InvoiceStatus } from '../../../common/enums/invoice-status.enum';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { UpdateInvoiceDto } from '../dto/update-invoice.dto';
import { InvoicesService } from '../services/invoices.service';

class InvoiceListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  profileId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  companyId?: string;

  @ApiPropertyOptional({ enum: InvoiceStatus })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  invoiceStatus?: InvoiceStatus;
}

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('backoffice/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @RequirePermissions('invoice.create')
  @ApiOperation({ summary: 'Create invoice' })
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: AuthUser) {
    return this.invoicesService.create(dto, {
      id: user._id,
      name: user.displayName,
    });
  }

  @Get()
  @RequirePermissions('invoice.view')
  @ApiOperation({ summary: 'List invoices' })
  findAll(@Query() query: InvoiceListQueryDto) {
    return this.invoicesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('invoice.view')
  @ApiOperation({ summary: 'Get invoice by id' })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('invoice.update')
  @ApiOperation({ summary: 'Update invoice' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invoicesService.update(id, dto, {
      id: user._id,
      name: user.displayName,
    });
  }

  @Post(':id/cancel')
  @RequirePermissions('invoice.update')
  @ApiOperation({ summary: 'Cancel invoice' })
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.invoicesService.cancel(id, {
      id: user._id,
      name: user.displayName,
    });
  }

  @Delete(':id')
  @RequirePermissions('invoice.delete')
  @ApiOperation({ summary: 'Delete invoice' })
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }
}
