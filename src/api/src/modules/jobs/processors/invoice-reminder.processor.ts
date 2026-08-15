import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InvoicesRepository } from '../../invoices/repositories/invoices.repository';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { UsersRepository } from '../../users/repositories/users.repository';

export const INVOICE_REMINDER_QUEUE = 'invoice-reminder';

@Processor(INVOICE_REMINDER_QUEUE)
export class InvoiceReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(InvoiceReminderProcessor.name);

  constructor(
    private readonly invoicesRepository: InvoicesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(_job: Job): Promise<{ overdue: number; reminders: number }> {
    const now = new Date();
    const until = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const overdue = await this.invoicesRepository.markOverdue(now);
    const dueSoon = await this.invoicesRepository.findDueReminders(now, until);

    const [staff] = await this.usersRepository.findMany({ isStaff: true }, 1, 20);
    for (const invoice of dueSoon) {
      for (const user of staff) {
        await this.notificationsService.create({
          userId: String(user._id),
          type: 'invoice_reminder',
          title: `Invoice due soon: ${invoice.invoiceNumber}`,
          body: `Invoice ${invoice.invoiceNumber} is due on ${invoice.dueDate.toISOString()}`,
          meta: { invoiceId: String(invoice._id) },
        });
      }
    }

    this.logger.log(
      `Invoice reminder: overdueMarked=${overdue.modifiedCount} reminders=${dueSoon.length}`,
    );
    return {
      overdue: overdue.modifiedCount ?? 0,
      reminders: dueSoon.length,
    };
  }
}
