import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { InvoicesController } from './controllers/invoices.controller';
import { InvoicesRepository } from './repositories/invoices.repository';
import {
  InvoiceCounter,
  InvoiceCounterSchema,
} from './schemas/invoice-counter.schema';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import { InvoicesService } from './services/invoices.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: InvoiceCounter.name, schema: InvoiceCounterSchema },
    ]),
    ProfilesModule,
    AuditLogsModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoicesRepository],
  exports: [InvoicesService, InvoicesRepository],
})
export class InvoicesModule {}
