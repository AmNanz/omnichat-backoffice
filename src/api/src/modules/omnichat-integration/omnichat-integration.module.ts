import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { OmnichatIntegrationService } from './services/omnichat-integration.service';

@Module({
  imports: [HttpModule],
  providers: [OmnichatIntegrationService],
  exports: [OmnichatIntegrationService],
})
export class OmnichatIntegrationModule {}
