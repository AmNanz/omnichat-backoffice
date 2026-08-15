import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

export const winstonConfig = {
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.ms(),
    nestWinstonModuleUtilities.format.nestLike('OmniChatBackofficeAPI', {
      prettyPrint: true,
    }),
  ),
  transports: [new winston.transports.Console()],
};
